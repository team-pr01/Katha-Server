/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Order from "../order/order.model";
import AppError from "../../errors/AppError";
import PersonalizedOrder from "../personalizedOrders/personalizedOrder.model";

const trackOrder = async (payload: {
    orderId: string;
    verifyWith: "email" | "phoneNumber";
    email?: string;
    phoneNumber?: string;
}) => {
    const { orderId, verifyWith, email, phoneNumber } = payload;

    // Validate required verification field
    if (verifyWith === "email" && !email) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email is required for verification");
    }
    if (verifyWith === "phoneNumber" && !phoneNumber) {
        throw new AppError(httpStatus.BAD_REQUEST, "Phone number is required for verification");
    }

    // Build query for verification
    const verifyQuery: any = {};
    if (verifyWith === "email") {
        verifyQuery["shippingAddress.email"] = email;
    } else {
        verifyQuery["shippingAddress.phoneNumber"] = phoneNumber;
    }

    // Try regular Order first
    let order = await Order.findOne({ orderId, ...verifyQuery })
        .populate("orderedItems.productId", "name slug variants")
        .lean();

    let orderType = "regular";

    // If not found, try Personalized Order
    if (!order) {
        const personalizedVerifyQuery: any = {};
        if (verifyWith === "email") {
            personalizedVerifyQuery.email = email;
        } else {
            personalizedVerifyQuery.phoneNumber = phoneNumber;
        }

        const personalizedOrder = await PersonalizedOrder.findOne({
            _id: orderId,
            ...personalizedVerifyQuery,
        }).lean();

        if (personalizedOrder) {
            order = personalizedOrder as any;
            orderType = "personalized";
        }
    }

    if (!order) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Order not found. Please check your order ID and verification details."
        );
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
        expectedDelivery: order.trackingDetails?.estimatedDelivery || null,
        shippingAddress: order.shippingAddress,
        trackingDetails: order.trackingDetails || null,
        timeline: trackingTimeline,
    };
};

// Build tracking timeline
const buildTrackingTimeline = (order: any) => {
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
    } else {
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
    } else {
        timeline.push({
            step: "Delivered",
            description: "Order will be delivered to your address",
            status: "pending",
            date: order.trackingDetails?.estimatedDelivery || null,
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

export const OrderTrackingServices = {
    trackOrder,
};