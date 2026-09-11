"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// SubOccasion Schema
const subOccasionSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
}, {
    _id: true,
});
// Main Occasion Schema
const occasionSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    subOccasions: {
        type: [subOccasionSchema],
        default: [],
    },
    imageUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});
// Text Search Index
occasionSchema.index({
    name: "text",
    description: "text",
    "subOccasions.name": "text",
});
// Indexes for filtering
occasionSchema.index({ isActive: 1 });
occasionSchema.index({ name: 1 });
const Occasion = (0, mongoose_1.model)("Occasion", occasionSchema);
exports.default = Occasion;
