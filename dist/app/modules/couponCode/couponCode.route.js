"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponCodeRoutes = void 0;
const express_1 = __importDefault(require("express"));
const couponCode_controller_1 = require("./couponCode.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const router = express_1.default.Router();
// Add coupon code (Admin / Moderator only)
router.post("/add", (0, auth_1.default)(auth_constants_1.UserRole.admin), couponCode_controller_1.CouponCodeControllers.addCouponCode);
// Add coupon code (Admin / Moderator only)
router.post("/validate", couponCode_controller_1.CouponCodeControllers.validateCouponCode);
// Get all coupon codes
router.get("/", couponCode_controller_1.CouponCodeControllers.getAllCouponCodes);
// Delete coupon code (Admin / Moderator only)
router.delete("/delete/:couponCodeId", (0, auth_1.default)(auth_constants_1.UserRole.admin), couponCode_controller_1.CouponCodeControllers.deleteCouponCode);
exports.CouponCodeRoutes = router;
