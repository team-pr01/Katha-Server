/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/nimbusPost/nimbusPost.service.ts
import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { CreateShipmentPayload } from "./nimbusPost.types";

const NIMBUS_BASE_URL = process.env.NIMBUS_BASE_URL || "https://api-v2.nimbuspost.com";
const NIMBUS_API_KEY = process.env.NIMBUS_API_KEY;
const NIMBUS_API_SECRET = process.env.NIMBUS_API_SECRET;

if (!NIMBUS_API_KEY || !NIMBUS_API_SECRET) {
  console.error("⚠️ Missing NIMBUS_API_KEY or NIMBUS_API_SECRET in .env file");
}

const HARDCODED_PICKUP_PINCODE = "431001";

// V2 Headers for all requests
const getNimbusHeaders = () => ({
  "x-api-key": NIMBUS_API_KEY,
  "x-api-secret": NIMBUS_API_SECRET,
  "Content-Type": "application/json",
});

export interface FrontendRatePayload {
  deliveryPincode: string | number;
  paymentMode?: "cod" | "prepaid";
  weight?: number; // grams
  length?: number;
  width?: number;
  height?: number;
  orderValuePaise?: number;
}

// 1. Calculate Rates / Check Serviceability
const calculateRates = async (input: FrontendRatePayload) => {
  const sanitizedPayload = {
    pickupPincode: HARDCODED_PICKUP_PINCODE,
    deliveryPincode: String(input.deliveryPincode ?? "").trim(),
    paymentMode: input.paymentMode ?? "prepaid",
    packages: [
      {
        weight: Number(input.weight ?? 500),
        length: Number(input.length ?? 10),
        width: Number(input.width ?? 10),
        height: Number(input.height ?? 10),
      },
    ],
    orderValuePaise: Number(input.orderValuePaise ?? 100000),
    sortBy: "cheapest" as const,
  };

  if (!/^[1-9][0-9]{5}$/.test(sanitizedPayload.deliveryPincode)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid delivery pincode: ${JSON.stringify(input.deliveryPincode)}`
    );
  }

  try {
    const response = await axios.post(
      `${NIMBUS_BASE_URL}/v2/serviceability`,
      sanitizedPayload,
      { headers: getNimbusHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error("Nimbus Rate Error:", error.response?.data || error.message);
    const actualMessage =
      error.response?.data?.error?.detail ||
      error.response?.data?.message ||
      error.message ||
      "Failed to calculate delivery charges";
    throw new AppError(error.response?.status || httpStatus.BAD_REQUEST, actualMessage);
  }
};

// 2. Create Shipment (Books the courier)
const createShipment = async (payload: CreateShipmentPayload) => {
  try {
    // Note: V2 Endpoint is /v2/shipments (Creates order + books courier in one go)
    const response = await axios.post(
      `${NIMBUS_BASE_URL}/v2/shipments`,
      payload,
      { headers: getNimbusHeaders() }
    );

    const data = response.data;

    if (!data.success) {
      throw new AppError(
        httpStatus.BAD_REQUEST, 
        data.error?.detail || data.message || "Failed to create shipment"
      );
    }

    // V2 returns: { success: true, data: { order: {...}, booking: { awb: "...", courier_name: "...", label_url: "..." } } }
    return data.data.booking;
  } catch (error: any) {
    console.error("Nimbus Create Shipment Error:", error.response?.data || error.message);
    throw new AppError(
      error.response?.status || httpStatus.BAD_REQUEST, 
      error.response?.data?.error?.detail || "Failed to create shipment"
    );
  }
};

// 3. Track Shipment
const trackShipment = async (awbNumber: string) => {
  try {
    // Note: V2 Endpoint is /v2/tracking/{awb}
    const response = await axios.get(
      `${NIMBUS_BASE_URL}/v2/tracking/${awbNumber}`,
      { headers: getNimbusHeaders() }
    );

    const data = response.data;

    if (!data.success) {
      throw new AppError(
        httpStatus.BAD_REQUEST, 
        data.error?.detail || data.message || "Failed to track shipment"
      );
    }

    return data.data; // Returns V2 tracking object
  } catch (error: any) {
    console.error("Nimbus Tracking Error:", error.response?.data || error.message);
    throw new AppError(
      error.response?.status || httpStatus.BAD_REQUEST, 
      error.response?.data?.error?.detail || "Failed to track shipment"
    );
  }
};

export const NimbusPostService = {
  calculateRates,
  createShipment,
  trackShipment,
};