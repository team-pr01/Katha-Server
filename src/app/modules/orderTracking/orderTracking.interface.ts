export type TOrderTrackingPayload = {
    orderId: string;
    verifyWith: "email" | "phoneNumber";
    email?: string;
    phoneNumber?: string;
};