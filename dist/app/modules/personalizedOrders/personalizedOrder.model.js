"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const personalizedOrderSchema = new mongoose_1.Schema({
    occasion: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    recipientFulName: {
        type: String,
        required: true,
        trim: true,
    },
    relationWithRecipient: {
        type: String,
        trim: true,
    },
    giftFor: {
        type: String,
        trim: true,
        index: true,
    },
    ageGroup: {
        type: String,
        required: true,
        enum: [
            "0-1 year",
            "1-3 years",
            "4-7 years",
            "8-12 years",
            "13-17 years",
            "18-25 years",
            "26-35 years",
            "36-50 years",
            "50+ years",
        ],
        index: true,
    },
    budgetRange: {
        type: String,
        required: true,
        enum: [
            "under ₹500",
            "₹500-₹1000",
            "₹1000-₹2000",
            "₹2000-₹5000",
            "₹5000-₹10000",
            "No budget limit",
        ],
        index: true,
    },
    specialRequirements: {
        type: String,
        trim: true,
    },
    personalizedMessage: {
        type: String,
        trim: true,
    },
    desiredDeliveryDate: {
        type: Date,
        required: true,
        index: true,
    },
    referenceImages: {
        type: [String],
        default: [],
    },
    // Contact info
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    state: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    pinCode: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    deliveryAddress: {
        type: String,
        required: true,
        trim: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
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
    addedBy: {
        type: String,
        enum: ["user", "admin"],
        index: true,
    },
}, {
    timestamps: true,
});
// Compound indexes for common filter combinations
personalizedOrderSchema.index({ userId: 1, createdAt: -1 });
personalizedOrderSchema.index({ occasion: 1, ageGroup: 1 });
personalizedOrderSchema.index({ budgetRange: 1, ageGroup: 1 });
personalizedOrderSchema.index({ city: 1, state: 1 });
personalizedOrderSchema.index({ desiredDeliveryDate: 1 });
const PersonalizedOrder = (0, mongoose_1.model)("PersonalizedOrder", personalizedOrderSchema);
exports.default = PersonalizedOrder;
