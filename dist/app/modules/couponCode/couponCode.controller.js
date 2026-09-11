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
exports.CouponCodeControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const couponCode_service_1 = require("./couponCode.service");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
// Add Coupon Code
const addCouponCode = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield couponCode_service_1.CouponCodeService.addCouponCode(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Coupon code added successfully",
        data: result,
    });
}));
// Get All Coupon Codes
const getAllCouponCodes = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { keyword, page = "1", limit = "10" } = req.query;
    const result = yield couponCode_service_1.CouponCodeService.getAllCouponCodes(keyword, Number(page), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Coupon codes fetched successfully",
        data: {
            couponCodes: result.data,
            pagination: result.meta,
        },
    });
}));
// Delete Coupon Code
const deleteCouponCode = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { couponCodeId } = req.params;
    const result = yield couponCode_service_1.CouponCodeService.deleteCouponCode(couponCodeId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Coupon code deleted successfully",
        data: result,
    });
}));
// Validate coupon code
const validateCouponCode = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.body;
    const result = yield couponCode_service_1.CouponCodeService.validateCouponCode(code);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Coupon code is valid",
        data: result,
    });
}));
exports.CouponCodeControllers = {
    addCouponCode,
    getAllCouponCodes,
    deleteCouponCode,
    validateCouponCode
};
