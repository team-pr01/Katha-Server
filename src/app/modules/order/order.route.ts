import express from "express";
import { OrderController } from "./order.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";

const router = express.Router();

// User routes
router.post("/checkout", OrderController.createOrder);
router.patch("/verify-payment/:orderId", OrderController.verifyPayment);
router.get("/my-orders", auth(UserRole.user), OrderController.getMyOrders);

// Admin routes
router.get("/", auth(UserRole.admin), OrderController.getAllOrders);
router.get("/:orderId", auth(UserRole.admin), OrderController.getSingleOrder);
router.patch("/status/:orderId", auth(UserRole.admin), OrderController.updateOrderStatus);
router.patch("/payment-status/:orderId", auth(UserRole.admin), OrderController.updatePaymentStatus);
router.delete("/:orderId", auth(UserRole.admin), OrderController.deleteOrder);

export const OrderRoutes = router;