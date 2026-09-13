import { ObjectId } from "mongoose";

export type TPersonalizedOrder = {
    occasion: string;
    recipientFulName: string;
    relationWithRecipient?: string;
    giftFor?: string;
    ageGroup:
    | "0-1 year"
    | "1-3 years"
    | "4-7 years"
    | "8-12 years"
    | "13-17 years"
    | "18-25 years"
    | "26-35 years"
    | "36-50 years"
    | "50+ years";
    budgetRange: "under ₹500" | "₹500-₹1000" | "₹1000-₹2000" | "₹2000-₹5000" | "₹5000-₹10000" | "No budget limit";
    specialRequirements?: string;
    personalizedMessage?: string;
    desiredDeliveryDate: Date;
    referenceImages?: string[];
    // Contact info
    fullName: string;
    phoneNumber: string;
    email: string;
    city: string;
    state: string;
    pinCode: string;
    deliveryAddress: string;
    userId: ObjectId;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    orderStatus: "pending" | "confirmed" | "processing" | "packed" | "shipped" | "delivered" | "cancelled" | "returned";
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

export type TPersonalizedOrderFilters = {
    keyword?: string;
    orderStatus?: string;
    occasion?: string;
    ageGroup?: string;
    budgetRange?: string;
    city?: string;
    state?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
};