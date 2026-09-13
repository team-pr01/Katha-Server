import express from "express";
import { OrderTrackingControllers } from "./orderTracking.controller";

const router = express.Router();

// Public route - no auth required
router.post("/", OrderTrackingControllers.trackOrder);

export const OrderTrackingRoutes = router;