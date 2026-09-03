import express from "express";
import { CouponCodeControllers } from "./couponCode.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";

const router = express.Router();

// Add coupon code (Admin / Moderator only)
router.post(
  "/add",
  auth(UserRole.admin),
  CouponCodeControllers.addCouponCode
);

// Add coupon code (Admin / Moderator only)
router.post(
  "/validate",
  CouponCodeControllers.validateCouponCode
);

// Get all coupon codes
router.get("/", CouponCodeControllers.getAllCouponCodes);

// Delete coupon code (Admin / Moderator only)
router.delete(
  "/delete/:couponCodeId",
  auth(UserRole.admin),
  CouponCodeControllers.deleteCouponCode
);

export const CouponCodeRoutes = router;
