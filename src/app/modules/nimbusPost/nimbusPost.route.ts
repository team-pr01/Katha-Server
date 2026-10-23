// src/routes/nimbusPost.route.ts
import express from "express";
import { NimbusPostController } from "./nimbusPost.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";

const router = express.Router();

// 🛒 Public/Customer Route (Used during checkout)
// Note: You might want a rate limit here to prevent abuse
router.post(
  "/calculate-rates",
  NimbusPostController.getShippingRates
);

// 🔒 Admin Routes
router.post(
  "/create-shipment",
  auth(UserRole.admin), // Only admins can create shipments
  NimbusPostController.createShipment
);

router.get(
  "/track/:awbNumber",
  auth(UserRole.admin, UserRole.user), // Both admin and customer can track
  NimbusPostController.trackShipment
);

export const NimbusPostRoutes = router;