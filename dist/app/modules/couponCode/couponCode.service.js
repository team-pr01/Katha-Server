"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponCodeService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const couponCode_model_1 = __importDefault(require("./couponCode.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
// Add Coupon Code
const addCouponCode = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const coupon = yield couponCode_model_1.default.create(payload);
    return coupon;
});
// Get All Coupon Codes
const getAllCouponCodes = (keyword, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {};
    const skip = (page - 1) * limit;
    // Search filter
    if (keyword) {
        query.$or = [{ code: { $regex: keyword, $options: "i" } }];
    }
    const [data, total] = yield Promise.all([
        couponCode_model_1.default.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
        couponCode_model_1.default.countDocuments(query),
    ]);
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
// Delete Coupon Code
const deleteCouponCode = (couponCodeId) => __awaiter(void 0, void 0, void 0, function* () {
    const coupon = yield couponCode_model_1.default.findByIdAndDelete(couponCodeId);
    if (!coupon) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Coupon code not found");
    }
    return coupon;
});
const validateCouponCode = (code) => __awaiter(void 0, void 0, void 0, function* () {
    const coupon = yield couponCode_model_1.default.findOne({ code });
    if (!coupon) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This coupon code is invalid.");
    }
    return coupon;
});
exports.CouponCodeService = {
    addCouponCode,
    getAllCouponCodes,
    deleteCouponCode,
    validateCouponCode,
};
