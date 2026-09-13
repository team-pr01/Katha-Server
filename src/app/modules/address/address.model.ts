import { Schema, model } from "mongoose";
import { TAddress } from "./address.interface";

const addressSchema = new Schema<TAddress>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // One address per user
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        pinCode: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        addressLine1: {
            type: String,
            required: true,
            trim: true,
        },
        addressLine2: {
            type: String,
            trim: true,
        },
        addressType: {
            type: String,
            enum: ["Home", "Office", "Other"],
            default: "Home",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for common queries
addressSchema.index({ city: 1, state: 1 });
addressSchema.index({ addressType: 1 });

const Address = model<TAddress>("Address", addressSchema);

export default Address;