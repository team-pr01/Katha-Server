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
exports.OrderTrackingServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const order_model_1 = __importDefault(require("../order/order.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const personalizedOrder_model_1 = __importDefault(require("../personalizedOrders/personalizedOrder.model"));
const trackOrder = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { orderId, verifyWith, email, phoneNumber } = payload;
    // Validate required verification field
    if (verifyWith === "email" && !email) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Email is required for verification");
    }
    if (verifyWith === "phoneNumber" && !phoneNumber) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Phone number is required for verification");
    }
    // Build query for verification
    const verifyQuery = {};
    if (verifyWith === "email") {
        verifyQuery["shippingAddress.email"] = email;
    }
    else {
        verifyQuery["shippingAddress.phoneNumber"] = phoneNumber;
    }
    // Try regular Order first
    let order = yield order_model_1.default.findOne(Object.assign({ orderId }, verifyQuery))
        .populate("orderedItems.productId", "name slug variants")
        .lean();
    let orderType = "regular";
    // If not found, try Personalized Order
    if (!order) {
        const personalizedVerifyQuery = {};
        if (verifyWith === "email") {
            personalizedVerifyQuery.email = email;
        }
        else {
            personalizedVerifyQuery.phoneNumber = phoneNumber;
        }
        const personalizedOrder = yield personalizedOrder_model_1.default.findOne(Object.assign({ _id: orderId }, personalizedVerifyQuery)).lean();
        if (personalizedOrder) {
            order = personalizedOrder;
            orderType = "personalized";
        }
    }
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found. Please check your order ID and verification details.");
    }
    // Build tracking timeline based on order status
    const trackingTimeline = buildTrackingTimeline(order);
    return {
        orderType,
        orderId: order.orderId || order._id,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        expectedDelivery: ((_a = order.trackingDetails) === null || _a === void 0 ? void 0 : _a.estimatedDelivery) || null,
        shippingAddress: order.shippingAddress,
        trackingDetails: order.trackingDetails || null,
        timeline: trackingTimeline,
    };
});
// Build tracking timeline
const buildTrackingTimeline = (order) => {
    var _a;
    const timeline = [];
    const created = order.createdAt;
    const updated = order.updatedAt;
    // Order Placed
    timeline.push({
        step: "Order Placed",
        description: "Your order has been placed successfully",
        status: "completed",
        date: created,
    });
    // Order Confirmed
    if (["shipped", "delivered", "returned"].includes(order.orderStatus)) {
        timeline.push({
            step: "Order Confirmed",
            description: "Seller has confirmed your order",
            status: "completed",
            date: updated,
        });
    }
    // Packed & Ready
    if (["shipped", "delivered"].includes(order.orderStatus)) {
        timeline.push({
            step: "Packed & Ready",
            description: "Your order has been packed and ready for shipment",
            status: "completed",
            date: updated,
        });
    }
    // Shipped
    if (["shipped", "delivered"].includes(order.orderStatus)) {
        timeline.push({
            step: "Shipped",
            description: "Order has been shipped from the warehouse",
            status: "completed",
            date: updated,
            current: order.orderStatus === "shipped",
        });
    }
    // Out for Delivery
    if (order.orderStatus === "delivered") {
        timeline.push({
            step: "Out for Delivery",
            description: "Order is out for delivery",
            status: "completed",
            date: updated,
        });
    }
    else {
        timeline.push({
            step: "Out for Delivery",
            description: "Order will be out for delivery soon",
            status: "pending",
            date: null,
        });
    }
    // Delivered
    if (order.orderStatus === "delivered") {
        timeline.push({
            step: "Delivered",
            description: "Order delivered successfully",
            status: "completed",
            date: updated,
        });
    }
    else {
        timeline.push({
            step: "Delivered",
            description: "Order will be delivered to your address",
            status: "pending",
            date: ((_a = order.trackingDetails) === null || _a === void 0 ? void 0 : _a.estimatedDelivery) || null,
        });
    }
    // Handle cancelled / returned
    if (order.orderStatus === "cancelled") {
        timeline.push({
            step: "Cancelled",
            description: "Order has been cancelled",
            status: "cancelled",
            date: updated,
        });
    }
    if (order.orderStatus === "returned") {
        timeline.push({
            step: "Returned",
            description: "Order has been returned",
            status: "returned",
            date: updated,
        });
    }
    return timeline;
};
exports.OrderTrackingServices = {
    trackOrder,
};
