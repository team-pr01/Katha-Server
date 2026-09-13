"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Order Item Schema
const orderItemSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    variantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    packagingName: {
        type: String,
        required: false,
        trim: true,
    },
    packagingPrice: {
        type: Number,
        required: false,
        min: 0,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    addedBy: {
        type: String,
        enum: ["user", "admin"],
        index: true,
    },
    confirmedAt: { type: Date, default: null },
    packedAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
});
// Shipping Address Schema
const shippingAddressSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    addressLine1: {
        type: String,
        required: true,
        trim: true,
    },
    addressLine2: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    state: {
        type: String,
        required: true,
        trim: true,
    },
    pinCode: {
        type: String,
        required: true,
        trim: true,
    },
});
// Tracking Details Schema
const trackingDetailsSchema = new mongoose_1.Schema({
    trackingNumber: {
        type: String,
        trim: true,
    },
    carrier: {
        type: String,
        trim: true,
    },
    trackingUrl: {
        type: String,
        trim: true,
    },
    estimatedDelivery: {
        type: Date,
    },
});
// Main Order Schema
const orderSchema = new mongoose_1.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false,
        index: true,
        default: null
    },
    orderedItems: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: function (items) {
                return items.length > 0;
            },
            message: "Order must have at least one item",
        },
    },
    couponCodeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "CouponCode",
        required: false,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
        index: true,
    },
    orderStatus: {
        type: String,
        enum: ["pending", "confirmed", "processing", "shipped", "cancelled", "delivered", "returned"],
        default: "pending",
        index: true,
    },
    paymentMethod: {
        type: String,
        enum: ["COD", "UPI"],
        required: false,
    },
    shippingAddress: {
        type: shippingAddressSchema,
        required: true,
    },
    trackingDetails: {
        type: trackingDetailsSchema,
        default: null,
    },
    razorpayPaymentId: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Indexes for common queries
orderSchema.index({ userId: 1, orderStatus: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderId: 1 });
// Pre-save middleware to generate orderId if not provided
orderSchema.pre("save", function (next) {
    if (!this.orderId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.orderId = `ORD-${timestamp}-${random}`;
    }
    next();
});
// Pre-update middleware to update updatedAt
orderSchema.pre("findOneAndUpdate", function (next) {
    this.set({ updatedAt: new Date() });
    next();
});
const Order = (0, mongoose_1.model)("Order", orderSchema);
exports.default = Order;
