/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model } from "mongoose";
import { THero } from "./hero.interface";

const heroSchema = new Schema<THero>(
    {
        alt: { type: String, trim: true },
        image: { type: String, required: true },
        link: { type: String, required: true },
    },
    { timestamps: true }
);

heroSchema.index({ isActive: 1, order: 1 });

const Hero = model<THero>("Hero", heroSchema);

export default Hero;