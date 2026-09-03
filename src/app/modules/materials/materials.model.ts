import { Schema, model } from "mongoose";
import { TMaterials, TMaterialVariant } from "./materials.type";

// Dimensions Schema
const dimensionsSchema = new Schema({
    length: {
        type: Number,
        required: true,
        min: 0,
    },
    width: {
        type: Number,
        required: true,
        min: 0,
    },
    height: {
        type: Number,
        required: true,
        min: 0,
    },
    unit: {
        type: String,
        enum: ["cm", "mm", "inch", "m", "ft"],
        default: "cm",
    },
}, {
    _id: false,
});

// Material Variant Schema
const materialVariantSchema = new Schema<TMaterialVariant>({
    design: {
        type: String,
        required: true,
        trim: true,
    },
    color: {
        type: String,
        required: true,
        trim: true,
    },
    dimensions: {
        type: dimensionsSchema,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    stockUnit: {
        type: String,
        required: true,
        trim: true,
        default: "piece",
    },
    purchasePrice: {
        type: Number,
        required: true,
        min: 0,
    },
    madeOf: {
        type: String,
        required: true,
        trim: true,
    },
});

// Main Material Schema
const materialSchema = new Schema<TMaterials>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        subCategory: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        variants: {
            type: [materialVariantSchema],
            default: [],
            validate: {
                validator: function (variants: TMaterialVariant[]) {
                    return variants.length > 0;
                },
                message: "Material must have at least one variant",
            },
        },
    },
    {
        timestamps: true,
    }
);

// Text Search Index
materialSchema.index({
    name: "text",
    category: "text",
    subCategory: "text",
    "variants.madeOf": "text",
    "variants.design": "text",
    "variants.color": "text",
});

// Compound indexes for common queries
materialSchema.index({ category: 1, subCategory: 1 });
materialSchema.index({ category: 1, isActive: 1 });
materialSchema.index({ "variants.madeOf": 1 });

const Material = model<TMaterials>("Material", materialSchema);

export default Material;