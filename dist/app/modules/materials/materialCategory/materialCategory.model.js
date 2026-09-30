"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const materialCategorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    subCategories: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
});
// Text search index
materialCategorySchema.index({
    name: "text",
    subCategories: "text",
});
const MaterialCategory = (0, mongoose_1.model)("MaterialCategory", materialCategorySchema);
exports.default = MaterialCategory;
