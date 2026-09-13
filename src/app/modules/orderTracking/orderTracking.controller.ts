import httpStatus from "http-status";
import { OrderTrackingServices } from "./orderTracking.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const trackOrder = catchAsync(async (req, res) => {
    const { orderId, verifyWith, email, phoneNumber } = req.body;

    const result = await OrderTrackingServices.trackOrder({
        orderId,
        verifyWith,
        email,
        phoneNumber,
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Order fetched successfully",
        data: result,
    });
});

export const OrderTrackingControllers = {
    trackOrder,
};