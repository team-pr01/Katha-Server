"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRoutes = void 0;
const express_1 = __importDefault(require("express"));
const order_controller_1 = require("./order.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const router = express_1.default.Router();
// User routes
router.post("/checkout", order_controller_1.OrderController.createOrder);
router.patch("/verify-payment/:orderId", order_controller_1.OrderController.verifyPayment);
router.get("/my-orders", (0, auth_1.default)(auth_constants_1.UserRole.user), order_controller_1.OrderController.getMyOrders);
// Admin routes
router.get("/", (0, auth_1.default)(auth_constants_1.UserRole.admin), order_controller_1.OrderController.getAllOrders);
router.get("/:orderId", (0, auth_1.default)(auth_constants_1.UserRole.admin), order_controller_1.OrderController.getSingleOrder);
router.patch("/status/:orderId", (0, auth_1.default)(auth_constants_1.UserRole.admin), order_controller_1.OrderController.updateOrderStatus);
router.patch("/payment-status/:orderId", (0, auth_1.default)(auth_constants_1.UserRole.admin), order_controller_1.OrderController.updatePaymentStatus);
router.delete("/:orderId", (0, auth_1.default)(auth_constants_1.UserRole.admin), order_controller_1.OrderController.deleteOrder);
exports.OrderRoutes = router;
