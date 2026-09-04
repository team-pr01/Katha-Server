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

const createOrder = async (userId: string | null, payload: any) => {
    // Validate user exists
    if (userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, "User not found");
        }
    }

    // Validate products and calculate total
    let subtotal = 0;
    let totalPackagingPrice = 0;
    const deliveryCharge = 50;

    for (const item of payload.orderedItems || []) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new AppError(httpStatus.NOT_FOUND, `Product not found: ${item.productId}`);
        }

        // Find the variant
        const variant = product.variants.find(
            (v: any) => v._id.toString() === item.variantId.toString()
        );
        if (!variant) {
            throw new AppError(httpStatus.NOT_FOUND, `Variant not found in product: ${item.productId}`);
        }

        // Check stock
        if (variant.stock < item.quantity) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Insufficient stock for variant.`
            );
        }

        // Calculate price
        const price = variant.discountedPrice || variant.basePrice;
        subtotal += price * item.quantity;

        // ✅ Calculate packaging price
        if (item.packagingPrice) {
            totalPackagingPrice += item.packagingPrice * item.quantity;
        }
    }

    // Calculate total with delivery charge and packaging
    const totalAmount = subtotal + deliveryCharge + totalPackagingPrice;

    // Handle coupon code
    let discountAmount = 0;
    let couponCodeId = null;

    if (payload.couponCode) {
        const couponCode = await CouponCode.findOne({
            code: payload.couponCode.toUpperCase().trim(),
        });

        if (!couponCode) {
            throw new AppError(httpStatus.NOT_FOUND, "Invalid coupon code");
        }

        // Calculate discount on subtotal + packaging (excluding delivery charge)
        const discountableAmount = subtotal + totalPackagingPrice;
        const discountPercentage = couponCode.discountPercentage;
        const calculatedDiscount = (discountableAmount * discountPercentage) / 100;

        // Ensure discount doesn't exceed discountable amount
        discountAmount = Math.min(calculatedDiscount, discountableAmount);

        couponCodeId = couponCode._id;
        await CouponCode.findByIdAndUpdate(couponCode._id, {
            $inc: { usedCount: 1 },
        });
    }

    // Final total after discount
    const finalTotal = totalAmount - discountAmount;

    const orderId = await generateOrderId();

    // Create order data
    const orderData: any = {
        orderId: orderId,
        userId: userId || null,
        orderedItems: payload.orderedItems,
        subtotal: subtotal,
        packagingPrice: totalPackagingPrice,
        deliveryCharge: deliveryCharge,
        discountAmount: discountAmount,
        couponCodeId: couponCodeId,
        couponCode: payload.couponCode?.toUpperCase().trim() || null,
        totalAmount: finalTotal,
        paymentMethod: payload.paymentMethod,
        shippingAddress: payload.shippingAddress,
        paymentStatus: "pending",
        orderStatus: "pending",
    };

    // If UPI payment, create Razorpay order
    if (payload.paymentMethod === "UPI") {
        const razorpayOrder = await razorpay.orders.create({
            amount: finalTotal * 100, // in paisa
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });
        orderData.razorpayOrderId = razorpayOrder.id;
        orderData.razorpayOrder = razorpayOrder;
    }

    const order = await Order.create(orderData);

    // Reduce stock
    for (const item of payload.orderedItems || []) {
        await Product.updateOne(
            { _id: item.productId, "variants._id": item.variantId },
            { $inc: { "variants.$.stock": -item.quantity } }
        );
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
const getAllOrders = async (
    filters: TOrderFilters = {},
    skip = 0,
    limit = 10
) => {
    const query: any = {};

    if (filters.userId) {
        query.userId = filters.userId;
    }

    if (filters.orderStatus) {
        query.orderStatus = filters.orderStatus;
    }

    if (filters.paymentStatus) {
        query.paymentStatus = filters.paymentStatus;
    }

    if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = filters.startDate;
        if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

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
    const order = await Order.findOne({ orderId })
        .populate("userId", "name email phoneNumber")
        .populate("orderedItems.productId", "name slug images")
        .lean();

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    return order;
};

// Get My Orders
const getMyOrders = async (userId: string, skip = 0, limit = 10) => {
    const query = { userId };

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
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

// Update Order Status
const updateOrderStatus = async (
    orderId: string,
    orderStatus: TOrder["orderStatus"]
) => {
    const order = await Order.findOne({ orderId });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    const validTransitions: Record<string, string[]> = {
        pending: ["shipped", "cancelled"],
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

    const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        { orderStatus },
        { new: true }
    );

    return updatedOrder;
};

// Update Payment Status
const updatePaymentStatus = async (
    orderId: string,
    paymentStatus: TOrder["paymentStatus"]
) => {
    const order = await Order.findOne({ orderId });

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
    const order = await Order.findOne({ orderId });

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

    await Order.findOneAndDelete({ orderId });

    return true;
};

export const OrderService = {
    createOrder,
    verifyPayment,
    getAllOrders,
    getSingleOrder,
    getMyOrders,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
};