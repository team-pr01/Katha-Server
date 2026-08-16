import { Schema, model } from "mongoose";
import { TOccasion, TSubOccasion } from "./occasion.interface";

// SubOccasion Schema
const subOccasionSchema = new Schema<TSubOccasion>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
    },
    {
        _id: true,
    }
);

// Main Occasion Schema
const occasionSchema = new Schema<TOccasion>(
    {
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
    },
    {
        timestamps: true,
    }
);

// Text Search Index
occasionSchema.index({
    name: "text",
    description: "text",
    "subOccasions.name": "text",
});

// Indexes for filtering
occasionSchema.index({ isActive: 1 });
occasionSchema.index({ name: 1 });

const Occasion = model<TOccasion>("Occasion", occasionSchema);

export default Occasion;