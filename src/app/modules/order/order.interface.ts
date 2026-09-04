import { ObjectId } from "mongoose";

export type TOrderItem = {
    productId: ObjectId;
    variantId: ObjectId;
    packagingName?: string;
    packagingPrice?: number;
    quantity: number;
};

export type TOrder = {
    orderId: string;
    userId?: ObjectId;
    orderedItems: TOrderItem[];
    totalAmount: number;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    orderStatus: "pending" | "shipped" | "cancelled" | "delivered" | "returned";
    paymentMethod?: "COD" | "UPI";
    couponCodeId?: ObjectId;
    shippingAddress: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        email?: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pinCode: string;
    };
    trackingDetails?: {
        trackingNumber?: string;
        carrier?: string;
        trackingUrl?: string;
        estimatedDelivery?: Date;
    };
    razorpayPaymentId?: string;
    createdAt: Date;
    updatedAt: Date;
};

export type TOrderFilters = {
    orderStatus?: string;
    paymentStatus?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
};