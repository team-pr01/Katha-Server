"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const addressSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true, // One address per user
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
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
    addressLine1: {
        type: String,
        required: true,
        trim: true,
    },
    addressLine2: {
        type: String,
        trim: true,
    },
    addressType: {
        type: String,
        enum: ["Home", "Office", "Other"],
        default: "Home",
        index: true,
    },
}, {
    timestamps: true,
});
// Compound indexes for common queries
addressSchema.index({ city: 1, state: 1 });
addressSchema.index({ addressType: 1 });
const Address = (0, mongoose_1.model)("Address", addressSchema);
exports.default = Address;
