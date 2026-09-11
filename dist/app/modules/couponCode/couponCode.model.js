"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CouponCodeSchema = new mongoose_1.Schema({
    code: {
        type: String,
        required: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});
const CouponCode = (0, mongoose_1.model)("CouponCode", CouponCodeSchema);
exports.default = CouponCode;
