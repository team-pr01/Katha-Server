"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const order_model_1 = __importDefault(require("./order.model"));
const product_model_1 = __importDefault(require("../product/product.model"));
const auth_model_1 = require("../auth/auth.model");
const razorpay_1 = require("../../utils/razorpay");
const generateOrderId_1 = require("../../utils/generateOrderId");
const couponCode_model_1 = __importDefault(require("../couponCode/couponCode.model"));
const createOrder = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Validate user exists
    if (userId) {
        const user = yield auth_model_1.User.findById(userId);
        if (!user) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
        }
    }
    // Validate products and calculate total
    let subtotal = 0;
    let totalPackagingPrice = 0;
    const deliveryCharge = 50;
    for (const item of payload.orderedItems || []) {
        const product = yield product_model_1.default.findById(item.productId);
        if (!product) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Product not found: ${item.productId}`);
        }
        // Find the variant
        const variant = product.variants.find((v) => v._id.toString() === item.variantId.toString());
        if (!variant) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Variant not found in product: ${item.productId}`);
        }
        // Check stock
        if (variant.stock < item.quantity) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Insufficient stock for variant.`);
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
        const couponCode = yield couponCode_model_1.default.findOne({
            code: payload.couponCode.toUpperCase().trim(),
        });
        if (!couponCode) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Invalid coupon code");
        }
        // Calculate discount on subtotal + packaging (excluding delivery charge)
        const discountableAmount = subtotal + totalPackagingPrice;
        const discountPercentage = couponCode.discountPercentage;
        const calculatedDiscount = (discountableAmount * discountPercentage) / 100;
        // Ensure discount doesn't exceed discountable amount
        discountAmount = Math.min(calculatedDiscount, discountableAmount);
        couponCodeId = couponCode._id;
        yield couponCode_model_1.default.findByIdAndUpdate(couponCode._id, {
            $inc: { usedCount: 1 },
        });
    }
    // Final total after discount
    const finalTotal = totalAmount - discountAmount;
    const orderId = yield (0, generateOrderId_1.generateOrderId)();
    // Create order data
    const orderData = {
        orderId: orderId,
        userId: userId || null,
        orderedItems: payload.orderedItems,
        subtotal: subtotal,
        packagingPrice: totalPackagingPrice,
        deliveryCharge: deliveryCharge,
        discountAmount: discountAmount,
        couponCodeId: couponCodeId,
        couponCode: ((_a = payload.couponCode) === null || _a === void 0 ? void 0 : _a.toUpperCase().trim()) || null,
        totalAmount: finalTotal,
        paymentMethod: payload.paymentMethod,
        shippingAddress: payload.shippingAddress,
        paymentStatus: "pending",
        orderStatus: "pending",
    };
    // If UPI payment, create Razorpay order
    if (payload.paymentMethod === "UPI") {
        const razorpayOrder = yield razorpay_1.razorpay.orders.create({
            amount: finalTotal * 100, // in paisa
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });
        orderData.razorpayOrderId = razorpayOrder.id;
        orderData.razorpayOrder = razorpayOrder;
    }
    const order = yield order_model_1.default.create(orderData);
    // Reduce stock
    for (const item of payload.orderedItems || []) {
        yield product_model_1.default.updateOne({ _id: item.productId, "variants._id": item.variantId }, { $inc: { "variants.$.stock": -item.quantity } });
    }
    return order;
});
// Verify UPI Payment
const verifyPayment = (orderId, razorpayPaymentId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.default.findOne({ orderId });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found");
    }
    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    yield order.save();
    return order;
});
// Get All Orders
const getAllOrders = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
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
        if (filters.startDate)
            query.createdAt.$gte = filters.startDate;
        if (filters.endDate)
            query.createdAt.$lte = filters.endDate;
    }
    const total = yield order_model_1.default.countDocuments(query);
    const orders = yield order_model_1.default.find(query)
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
});
// Get Single Order
const getSingleOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.default.findOne({ orderId })
        .populate("userId", "name email phoneNumber")
        .populate("orderedItems.productId", "name slug images")
        .lean();
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found");
    }
    return order;
});
// Get My Orders
const getMyOrders = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, skip = 0, limit = 10) {
    const query = { userId };
    const total = yield order_model_1.default.countDocuments(query);
    const orders = yield order_model_1.default.find(query)
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
});
// Update Order Status
const updateOrderStatus = (orderId, orderStatus) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const order = yield order_model_1.default.findOne({ orderId });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found");
    }
    const validTransitions = {
        pending: ["shipped", "cancelled"],
        shipped: ["delivered", "cancelled"],
        delivered: ["returned"],
        cancelled: [],
        returned: [],
    };
    if (!((_a = validTransitions[order.orderStatus]) === null || _a === void 0 ? void 0 : _a.includes(orderStatus))) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot transition from ${order.orderStatus} to ${orderStatus}`);
    }
    // If cancelling, restore stock
    if (orderStatus === "cancelled" && order.orderStatus !== "cancelled") {
        for (const item of order.orderedItems) {
            yield product_model_1.default.updateOne({ _id: item.productId, "variants._id": item.variantId }, { $inc: { "variants.$.stock": item.quantity } });
        }
    }
    const updatedOrder = yield order_model_1.default.findOneAndUpdate({ orderId }, { orderStatus }, { new: true });
    return updatedOrder;
});
// Update Payment Status
const updatePaymentStatus = (orderId, paymentStatus) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.default.findOne({ orderId });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found");
    }
    const updatedOrder = yield order_model_1.default.findOneAndUpdate({ orderId }, { paymentStatus }, { new: true });
    return updatedOrder;
});
// Delete Order
const deleteOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.default.findOne({ orderId });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found");
    }
    // Restore stock if order is not cancelled or returned
    if (order.orderStatus !== "cancelled" && order.orderStatus !== "returned") {
        for (const item of order.orderedItems) {
            yield product_model_1.default.updateOne({ _id: item.productId, "variants._id": item.variantId }, { $inc: { "variants.$.stock": item.quantity } });
        }
    }
    yield order_model_1.default.findOneAndDelete({ orderId });
    return true;
});
exports.OrderService = {
    createOrder,
    verifyPayment,
    getAllOrders,
    getSingleOrder,
    getMyOrders,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
};
