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
        const personalizedOrder = yield personalizedOrder_model_1.default.findById(orderId).lean();
        if (personalizedOrder &&
            ((verifyWith === "email" && personalizedOrder.email === email) ||
                (verifyWith === "phoneNumber" &&
                    personalizedOrder.phoneNumber === phoneNumber))) {
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
// Build tracking timeline - ALWAYS returns all 5 steps
const buildTrackingTimeline = (order) => {
    var _a;
    // const created = order.createdAt;
    const updated = order.updatedAt;
    const currentStatus = order.orderStatus;
    // Define status order (index matters)
    const statusOrder = ["pending", "confirmed", "processing", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    // Handle cancelled / returned separately
    const isCancelled = currentStatus === "cancelled";
    const isReturned = currentStatus === "returned";
    // Helper to determine step state
    const getStepState = (stepIndex) => {
        if (isCancelled || isReturned) {
            // If cancelled/returned, all steps before the cancellation point are completed
            return stepIndex <= currentIndex ? "completed" : "pending";
        }
        if (stepIndex < currentIndex)
            return "completed";
        if (stepIndex === currentIndex)
            return "completed"; // Current step is also completed
        return "pending";
    };
    // Helper to determine date for each step
    const getStepDate = (stepIndex) => {
        if (isCancelled || isReturned) {
            return stepIndex <= currentIndex ? updated : null;
        }
        return stepIndex <= currentIndex ? updated : null;
    };
    // Build all 5 timelines
    const timeline = [
        {
            step: "Order Placed",
            status: getStepState(0),
            description: getStepState(0) === "completed"
                ? "Your order has been placed successfully"
                : "Your order will be placed soon",
            date: getStepDate(0),
            current: currentStatus === "pending",
        },
        {
            step: "Order Confirmed",
            status: getStepState(1),
            description: getStepState(1) === "completed"
                ? "Seller has confirmed your order"
                : "Waiting for seller confirmation",
            date: getStepDate(1),
            current: currentStatus === "confirmed",
        },
        {
            step: "Processing",
            status: getStepState(2),
            description: getStepState(2) === "completed"
                ? "Your order is being packed and processed"
                : "Order will be processed soon",
            date: getStepDate(2),
            current: currentStatus === "processing",
        },
        {
            step: "Shipped",
            status: getStepState(3),
            description: getStepState(3) === "completed"
                ? "Order has been shipped from the warehouse"
                : "Order will be shipped soon",
            date: getStepDate(3),
            current: currentStatus === "shipped",
        },
        {
            step: "Delivered",
            status: getStepState(4),
            description: getStepState(4) === "completed"
                ? "Order delivered successfully"
                : "Order will be delivered to your address",
            date: ((_a = order.trackingDetails) === null || _a === void 0 ? void 0 : _a.estimatedDelivery)
                ? getStepState(4) === "completed"
                    ? updated
                    : order.trackingDetails.estimatedDelivery
                : null,
            current: currentStatus === "delivered",
        },
    ];
    // If cancelled or returned, mark the relevant step
    if (isCancelled) {
        timeline.push({
            step: "Cancelled",
            status: "cancelled",
            description: "Order has been cancelled",
            date: updated,
            current: true,
        });
    }
    if (isReturned) {
        timeline.push({
            step: "Returned",
            status: "returned",
            description: "Order has been returned",
            date: updated,
            current: true,
        });
    }
    return timeline;
};
exports.OrderTrackingServices = {
    trackOrder,
};
