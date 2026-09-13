import { ObjectId } from "mongoose";

export type TAddress = {
    userId: ObjectId;
    name: string;
    email?: string;
    phoneNumber: string;
    city: string;
    state: string;
    pinCode: string;
    addressLine1: string;
    addressLine2?: string;
    addressType: "Home" | "Office" | "Other";
    createdAt?: Date;
    updatedAt?: Date;
};

export type TAddressFilters = {
    search?: string;
    city?: string;
    state?: string;
    addressType?: string;
    pinCode?: string;
};