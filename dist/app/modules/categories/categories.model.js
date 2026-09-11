"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    areaName: {
        type: String,
        trim: true,
        index: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    subCategories: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
});
// Text Search Index
categorySchema.index({
    name: "text",
    areaName: "text",
    description: "text",
    subCategories: "text",
});
// Index for filtering
categorySchema.index({ areaName: 1, isActive: 1 });
categorySchema.index({ name: 1, areaName: 1 });
const Categories = (0, mongoose_1.model)("Categories", categorySchema);
exports.default = Categories;
