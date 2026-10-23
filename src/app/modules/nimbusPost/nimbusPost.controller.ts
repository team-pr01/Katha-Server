// src/controllers/nimbusPost.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { NimbusPostService } from "./nimbusPost.service";
import sendResponse from "../../utils/sendResponse";

// 1. Get Delivery Rates (Called by customer on checkout page)
const getShippingRates = catchAsync(async (req: Request, res: Response) => {
  const result = await NimbusPostService.calculateRates(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Delivery rates fetched successfully",
    data: result,
  });
});

// 2. Create Shipment (Called by Admin when marking order as Shipped)
const createShipment = catchAsync(async (req: Request, res: Response) => {
  // Can accept payload directly, or use req.params.orderId to fetch from DB
  const result = await NimbusPostService.createShipment(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Shipment created successfully",
    data: result,
  });
});

// 3. Track Shipment (Called by Admin/Customer)
const trackShipment = catchAsync(async (req: Request, res: Response) => {
  const { awbNumber } = req.params;
  const result = await NimbusPostService.trackShipment(awbNumber);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tracking details fetched successfully",
    data: result,
  });
});

export const NimbusPostController = {
  getShippingRates,
  createShipment,
  trackShipment,
};