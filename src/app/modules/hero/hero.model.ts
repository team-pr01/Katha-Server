/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model } from "mongoose";
import { THero } from "./hero.interface";

const heroButtonSchema = new Schema(
    {
        label: { type: String, required: true, trim: true },
        link: { type: String, required: true, trim: true },
        variant: {
            type: String,
            enum: ["primary", "secondary", "outline"],
            default: "primary",
        },
    },
    { _id: false }
);

const heroColorsSchema = new Schema(
    {
        titleColor: {
            type: String,
            default: "#FFFFFF",
            match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"],
        },
        subtitleColor: {
            type: String,
            default: "#F59E0B",
            match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"],
        },
        descriptionColor: {
            type: String,
            default: "#E5E7EB",
            match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"],
        },
        buttonTextColor: {
            type: String,
            default: "#1F2937",
            match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"],
        },
    },
    { _id: false }
);

const heroSchema = new Schema<THero>(
    {
        title: { type: String, required: true, trim: true },
        highlightedTitle: { type: String, trim: true },
        description: { type: String, required: true, trim: true },
        image: { type: String, required: true },
        buttons: {
            type: [heroButtonSchema],
            default: [],
            validate: {
                validator: (v: any[]) => v.length <= 3,
                message: "Maximum 3 buttons allowed",
            },
        },
        colors: { type: heroColorsSchema, required: true },
        overlayOpacity: {
            type: Number,
            default: 0.5,
            min: 0,
            max: 1,
        },
        textAlignment: {
            type: String,
            enum: ["left", "center", "right"],
            default: "left",
        },
        isActive: { type: Boolean, default: true, index: true },
        order: { type: Number, default: 0, index: true },
    },
    { timestamps: true }
);

heroSchema.index({ isActive: 1, order: 1 });

const Hero = model<THero>("Hero", heroSchema);

export default Hero;