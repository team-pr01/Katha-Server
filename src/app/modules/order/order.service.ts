/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import Order from "./order.model";
import { TOrder, TOrderFilters } from "./order.interface";
import Product from "../product/product.model";
import { User } from "../auth/auth.model";
import { razorpay } from "../../utils/razorpay";
import { generateOrderId } from "../../utils/generateOrderId";
import CouponCode from "../couponCode/couponCode.model";
import { NimbusPostService } from "../nimbusPost/nimbusPost.service";

const createOrder = async (userId: string | null, payload: any) => {
    // 1. Validate user exists
    if (userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, "User not found");
        }
    }

    // 2. Validate products and calculate total
    let subtotal = 0;
    let totalPackagingPrice = 0;

    // ✅ Use the shipping charge sent by the frontend, fallback to 50 if missing
    const deliveryCharge = payload.shippingCharge || 50;
    let totalWeightInGrams = 0; // We need this for NimbusPost

    for (const item of payload.orderedItems || []) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new AppError(httpStatus.NOT_FOUND, `Product not found: ${item.productId}`);
        }

        const variant = product.variants.find(
            (v: any) => v._id.toString() === item.variantId.toString()
        );
        if (!variant) {
            throw new AppError(httpStatus.NOT_FOUND, `Variant not found in product: ${item.productId}`);
        }

        if (variant.stock < item.quantity) {
            throw new AppError(httpStatus.BAD_REQUEST, `Insufficient stock for variant.`);
        }

        const price = variant.discountedPrice || variant.basePrice;
        subtotal += price * item.quantity;

        if (item.packagingPrice) {
            totalPackagingPrice += item.packagingPrice * item.quantity;
        }

        // Mock weight calculation: 500g per item (adjust based on your actual product weight logic)
        totalWeightInGrams += item.quantity * 500;
    }

    // Calculate total with delivery charge and packaging
    const totalAmount = subtotal + deliveryCharge + totalPackagingPrice;

    // 3. Handle coupon code
    let discountAmount = 0;
    let couponCodeId = null;

    if (payload.couponCode) {
        const couponCode = await CouponCode.findOne({
            code: payload.couponCode.toUpperCase().trim(),
        });

        if (!couponCode) {
            throw new AppError(httpStatus.NOT_FOUND, "Invalid coupon code");
        }

        const discountableAmount = subtotal + totalPackagingPrice;
        const discountPercentage = couponCode.discountPercentage;
        const calculatedDiscount = (discountableAmount * discountPercentage) / 100;

        discountAmount = Math.min(calculatedDiscount, discountableAmount);

        couponCodeId = couponCode._id;
        await CouponCode.findByIdAndUpdate(couponCode._id, {
            $inc: { usedCount: 1 },
        });
    }

    const finalTotal = totalAmount - discountAmount;
    const orderId = await generateOrderId(); // Assume you have this helper function

    // 4. Create order data in your database FIRST
    const orderData: any = {
        orderId: orderId,
        userId: userId || null,
        orderedItems: payload.orderedItems,
        subtotal: subtotal,
        packagingPrice: totalPackagingPrice,
        deliveryCharge: deliveryCharge, // ✅ Saved actual selected charge
        discountAmount: discountAmount,
        couponCodeId: couponCodeId,
        couponCode: payload.couponCode?.toUpperCase().trim() || null,
        totalAmount: finalTotal,
        paymentMethod: payload.paymentMethod,
        shippingAddress: payload.shippingAddress,
        paymentStatus: "pending",
        orderStatus: "pending",
        awbNumber: null, // Initialize fields
        courierName: null,
    };

    // If UPI payment, create Razorpay order
    if (payload.paymentMethod === "UPI") {
        const razorpayOrder = await razorpay.orders.create({
            amount: finalTotal * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });
        orderData.razorpayOrderId = razorpayOrder.id;
        orderData.razorpayOrder = razorpayOrder;
    }

    const order = await Order.create(orderData);

    // 5. Reduce stock in your DB
    for (const item of payload.orderedItems || []) {
        await Product.updateOne(
            { _id: item.productId, "variants._id": item.variantId },
            { $inc: { "variants.$.stock": -item.quantity } }
        );
    }

    // 6. 📦 BOOK THE SHIPMENT IN NIMBUSPOST
    try {
        // Build the V2 payload mapping from your frontend data
        const nimbusPayload = {
            order_number: order.orderId,
            order_type: "b2c",
            payment_mode: payload.paymentMethod === "COD" ? ("cod" as const) : ("prepaid" as const),
            order_collectable_amount: payload.paymentMethod === "COD" ? finalTotal : undefined,
            warehouse_id: process.env.NIMBUS_WAREHOUSE_ID || "YOUR_WAREHOUSE_ID", // Set in .env!
            shipping_address: {
                name: `${payload.shippingAddress.firstName} ${payload.shippingAddress.lastName}`,
                email: payload.shippingAddress.email || "",
                address: payload.shippingAddress.addressLine1,
                address_opt: payload.shippingAddress.addressLine2 || "",
                pincode: Number(payload.shippingAddress.pinCode),
                city: payload.shippingAddress.city,
                state: payload.shippingAddress.state,
                country: "India",
                phone: Number(payload.shippingAddress.phoneNumber),
            },
            items: payload.orderedItems.map((item: any) => ({
                name: item.name || "Product",
                qty: item.quantity,
                price: item.price || 0,
                sku: item.sku || "SKU-DEFAULT",
            })),
            package: {
                weight: totalWeightInGrams > 0 ? (totalWeightInGrams / 1000) : 0.5,
                length: 10,
                width: 10,
                height: 10,
            },
            // ✅ CRITICAL: Book the exact courier the user selected
            courier_id: payload.selectedCourierId || undefined,
        };

        console.log("Calling NimbusPost createShipment...", nimbusPayload);
        const booking = await NimbusPostService.createShipment(nimbusPayload);

        // 7. Update order with NimbusPost Booking Details
        order.trackingDetails = {
            ...order.trackingDetails,
            trackingNumber: booking.awb,
            carrier: booking.courier_name,
        };
        order.orderStatus = "pending";
        await order.save();

        console.log(`✅ Order ${order.orderId} booked on NimbusPost. AWB: ${booking.awb}`);

    } catch (nimbusError: any) {
        console.error(`❌ Failed to book NimbusPost shipment for order ${order.orderId}:`, nimbusError.message);
    }

    return order;
};

// Verify UPI Payment
const verifyPayment = async (orderId: string, razorpayPaymentId: string) => {
    const order = await Order.findOne({ orderId });
    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    return order;
};

// Get All Orders
const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getAllOrders = async (
    filters: TOrderFilters = {},
    skip = 0,
    limit = 10
) => {

    const query: any = {};

    if (filters.userId) {
        query.userId = filters.userId;
    }

    if (filters.orderStatus && filters.orderStatus !== "all") {
        query.orderStatus = filters.orderStatus;
    }

    if (filters.paymentStatus && filters.paymentStatus !== "all") {
        query.paymentStatus = filters.paymentStatus;
    }

    if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = filters.startDate;
        if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    // ✅ Search across orderId AND customer details
    if (filters.keyword) {
        const rawKeyword = String(filters.keyword).trim(); // Safe cast
        const regex = new RegExp(escapeRegExp(rawKeyword), "i");

        query.$or = [
            { orderId: regex },
            { "shippingAddress.firstName": regex },
            { "shippingAddress.lastName": regex },
            { "shippingAddress.email": regex },
            { "shippingAddress.phoneNumber": regex },
            { "shippingAddress.city": regex },
            { "shippingAddress.state": regex },
            { "shippingAddress.pinCode": regex },
            { "shippingAddress.addressLine1": regex },
            { "shippingAddress.addressLine2": regex },
        ];
    }

    console.log("MongoDB Query:", JSON.stringify(query, null, 2)); // 👈 Debug log

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
        .populate("userId", "name email phoneNumber")
        .populate("orderedItems.productId", "name slug images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        data: orders,
        meta: {
            total,
            filteredTotal: total,
            skip,
            limit,
            totalPages: Math.ceil(total / limit),
            currentPage: Math.floor(skip / limit) + 1,
            hasMore: skip + limit < total,
        },
    };
};
// Get Single Order
const getSingleOrder = async (orderId: string) => {
    const order = await Order.findById(orderId)
        .populate("userId", "name email phoneNumber")
        .populate("orderedItems.productId", "name slug images")
        .lean();

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    return order;
};

// Get My Orders
const getMyOrders = async (
    userId: string,
    skip = 0,
    limit = 10,
    filters: TOrderFilters = {}
) => {
    const query: any = { userId };

    if (filters.keyword) {
        query.$or = [
            { orderId: { $regex: filters.keyword, $options: "i" } },
        ];
    }

    if (filters.orderStatus) {
        query.orderStatus = filters.orderStatus;
    }

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
        .populate("orderedItems.productId", "name slug variants")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // Enrich ordered items with variant details
    const enrichedOrders = orders.map((order: any) => {
        const enrichedItems = order.orderedItems.map((item: any) => {
            const product = item.productId;
            let variant = null;

            // Find the variant from the product's variants array
            if (product && product.variants && item.variantId) {
                variant = product.variants.find(
                    (v: any) => v._id.toString() === item.variantId.toString()
                );
            }

            return {
                ...item,
                variant: variant
                    ? {
                        _id: variant._id,
                        name: variant.name,
                        images: variant.images || [],
                        description: variant.description,
                        design: variant.design,
                        size: variant.size,
                        color: variant.color,
                        packSize: variant.packSize,
                        weight: variant.weight,
                        basePrice: variant.basePrice,
                        discountedPrice: variant.discountedPrice,
                        bulkPrice: variant.bulkPrice,
                    }
                    : null,
                // Keep product with limited fields
                productId: product
                    ? {
                        _id: product._id,
                        name: product.name,
                        slug: product.slug,
                    }
                    : item.productId,
            };
        });

        return {
            ...order,
            orderedItems: enrichedItems,
        };
    });

    return {
        data: enrichedOrders,
        meta: {
            total,
            filteredTotal: total,
            skip,
            limit,
            totalPages: Math.ceil(total / limit),
            currentPage: Math.floor(skip / limit) + 1,
            hasMore: skip + limit < total,
        },
    };
};

const getOrderStats = async (month: number, year: number) => {
    // Calculate Start and End of the SELECTED Month
    const startOfSelectedMonth = new Date(year, month - 1, 1);
    const endOfSelectedMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Calculate Start and End of the PREVIOUS Month (relative to selected)
    const startOfPrevMonth = new Date(year, month - 2, 1);
    const endOfPrevMonth = new Date(year, month - 1, 0, 23, 59, 59, 999);

    // Calculate Today and Last Week relative to REAL current time
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfLastWeek = new Date(now);
    startOfLastWeek.setDate(now.getDate() - 7);

    // ─── 1. OVERALL (ALL-TIME) STATS ─────────────────────
    const overallStatsData = await Order.aggregate([
        {
            $facet: {
                statusCounts: [
                    { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
                ],
                paymentCounts: [
                    { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
                ],
                totalRevenue: [
                    { $match: { orderStatus: "delivered" } },
                    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
                ],
                totalOrders: [
                    { $count: "count" }
                ]
            }
        }
    ]);

    const overallStatusCounts: Record<string, number> = {
        pending: 0, confirmed: 0, processing: 0, shipped: 0,
        delivered: 0, cancelled: 0, returned: 0
    };
    overallStatsData[0].statusCounts.forEach((s: any) => {
        if (s._id) overallStatusCounts[s._id] = s.count;
    });

    const overallPaymentCounts: Record<string, number> = {
        pending: 0, paid: 0, failed: 0, refunded: 0
    };
    overallStatsData[0].paymentCounts.forEach((p: any) => {
        if (p._id) overallPaymentCounts[p._id] = p.count;
    });

    const overallRevenue = overallStatsData[0].totalRevenue[0]?.total || 0;
    const overallOrders = overallStatsData[0].totalOrders[0]?.count || 0;
    const overallAvgOrderValue = overallOrders > 0 ? Math.round(overallRevenue / overallOrders) : 0;

    // ─── 2. SELECTED MONTH STATS ─────────────────────────
    const monthlyStatsData = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startOfSelectedMonth, $lte: endOfSelectedMonth },
            },
        },
        {
            $facet: {
                statusCounts: [
                    { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
                ],
                paymentCounts: [
                    { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
                ],
                totalRevenue: [
                    { $match: { orderStatus: "delivered" } },
                    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
                ],
                totalOrders: [
                    { $count: "count" }
                ]
            }
        }
    ]);

    const monthlyStatusCounts: Record<string, number> = {
        pending: 0, confirmed: 0, processing: 0, shipped: 0,
        delivered: 0, cancelled: 0, returned: 0
    };
    monthlyStatsData[0].statusCounts.forEach((s: any) => {
        if (s._id) monthlyStatusCounts[s._id] = s.count;
    });

    const monthlyPaymentCounts: Record<string, number> = {
        pending: 0, paid: 0, failed: 0, refunded: 0
    };
    monthlyStatsData[0].paymentCounts.forEach((p: any) => {
        if (p._id) monthlyPaymentCounts[p._id] = p.count;
    });

    const monthlyRevenue = monthlyStatsData[0].totalRevenue[0]?.total || 0;
    const monthlyOrders = monthlyStatsData[0].totalOrders[0]?.count || 0;
    const monthlyAvgOrderValue = monthlyOrders > 0 ? Math.round(monthlyRevenue / monthlyOrders) : 0;

    // ─── 3. Time-based Stats helper ──────────────────────
    const getStatsForPeriod = async (startDate: Date, endDate?: Date) => {
        const matchStage: any = { createdAt: { $gte: startDate } };
        if (endDate) matchStage.createdAt.$lte = endDate;

        const stats = await Order.aggregate([
            { $match: matchStage },
            {
                $facet: {
                    revenue: [
                        { $match: { orderStatus: "delivered" } },
                        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
                    ],
                    orders: [{ $count: "count" }]
                }
            }
        ]);

        return {
            revenue: stats[0].revenue[0]?.total || 0,
            orders: stats[0].orders[0]?.count || 0,
        };
    };

    const todayStats = await getStatsForPeriod(startOfToday);
    const thisWeekStats = await getStatsForPeriod(startOfLastWeek);
    const thisMonthStats = await getStatsForPeriod(startOfSelectedMonth, endOfSelectedMonth);
    const lastMonthStats = await getStatsForPeriod(startOfPrevMonth, endOfPrevMonth);

    // ─── 4. Monthly Revenue Comparison (Last 6 months) ───
    const startOf12MonthsAgo = new Date(year, month - 12, 1);
    const monthlyRevenueChart = await Order.aggregate([
        {
            $match: {
                orderStatus: "delivered",
                createdAt: { $gte: startOf12MonthsAgo, $lte: endOfSelectedMonth },
            }
        },
        {
            $group: {
                _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                revenue: { $sum: "$totalAmount" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueComparison = monthlyRevenueChart.map((item) => ({
        month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        revenue: item.revenue,
    }));

    // ─── 5. Final Response ───────────────────────────────
    return {
        // All-time data
        overall: {
            totalOrders: overallOrders,
            totalRevenue: overallRevenue,
            avgOrderValue: overallAvgOrderValue,
            statusCounts: overallStatusCounts,
            paymentCounts: overallPaymentCounts,
        },
        // Selected month data
        monthly: {
            totalOrders: monthlyOrders,
            totalRevenue: monthlyRevenue,
            avgOrderValue: monthlyAvgOrderValue,
            statusCounts: monthlyStatusCounts,
            paymentCounts: monthlyPaymentCounts,
            selectedMonth: `${monthNames[month - 1]} ${year}`,
        },
        timeBased: {
            today: todayStats,
            thisWeek: thisWeekStats,
            thisMonth: thisMonthStats,
            lastMonth: lastMonthStats,
        },
        revenueComparison,
    };
};

// Update Order Status
const updateOrderStatus = async (
    orderId: string,
    orderStatus: TOrder["orderStatus"]
) => {
    const order = await Order.findById(orderId);

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    const validTransitions: Record<string, string[]> = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["processing", "cancelled"],
        processing: ["shipped", "cancelled"],
        shipped: ["delivered", "cancelled"],
        delivered: ["returned"],
        cancelled: [],
        returned: [],
    };

    if (!validTransitions[order.orderStatus]?.includes(orderStatus)) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Cannot transition from ${order.orderStatus} to ${orderStatus}`
        );
    }

    // If cancelling, restore stock
    if (orderStatus === "cancelled" && order.orderStatus !== "cancelled") {
        for (const item of order.orderedItems) {
            await Product.updateOne(
                { _id: item.productId, "variants._id": item.variantId },
                { $inc: { "variants.$.stock": item.quantity } }
            );
        }
    }

    const updateData: Record<string, any> = { orderStatus };

    // ─── Auto-mark COD payment as paid on delivery ──────
    if (
        orderStatus === "delivered" &&
        order.paymentMethod === "COD" &&
        order.paymentStatus !== "paid"
    ) {
        updateData.paymentStatus = "paid";
        updateData.paidAt = new Date();
    }

    // ─── Auto-mark payment as refunded on return ────────
    if (orderStatus === "returned" && order.paymentStatus === "paid") {
        updateData.paymentStatus = "refunded";
        // updateData.refundedAt = new Date(); // Uncomment if your schema has this field
    }

    const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { $set: updateData },
        { new: true }
    );

    return updatedOrder;
};

// Update Payment Status
const updatePaymentStatus = async (
    orderId: string,
    paymentStatus: TOrder["paymentStatus"]
) => {
    const order = await Order.findById(orderId);

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        { paymentStatus },
        { new: true }
    );

    return updatedOrder;
};

// Delete Order
const deleteOrder = async (orderId: string) => {
    const order = await Order.findById(orderId);

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    // Restore stock if order is not cancelled or returned
    if (order.orderStatus !== "cancelled" && order.orderStatus !== "returned") {
        for (const item of order.orderedItems) {
            await Product.updateOne(
                { _id: item.productId, "variants._id": item.variantId },
                { $inc: { "variants.$.stock": item.quantity } }
            );
        }
    }

    await Order.findByIdAndDelete(orderId);

    return true;
};

export const OrderService = {
    createOrder,
    verifyPayment,
    getAllOrders,
    getSingleOrder,
    getMyOrders,
    getOrderStats,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
};