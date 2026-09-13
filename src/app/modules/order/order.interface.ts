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
    orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
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
     addedBy : "user" | "admin";
    confirmedAt?: Date;
    packedAt?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    returnedAt?: Date;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
};

export type TOrderFilters = {
    keyword?: string;
    orderStatus?: string;
    paymentStatus?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
};