"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const mongoose_1 = require("mongoose");
const heroSchema = new mongoose_1.Schema({
    alt: { type: String, trim: true },
    image: { type: String, required: true },
    link: { type: String, required: true },
}, { timestamps: true });
heroSchema.index({ isActive: 1, order: 1 });
const Hero = (0, mongoose_1.model)("Hero", heroSchema);
exports.default = Hero;
