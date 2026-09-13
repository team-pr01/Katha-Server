import httpStatus from "http-status";
import { PersonalizedOrderServices } from "./personalizedOrder.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// Submit Personalized Order
const submitPersonalizedOrder = catchAsync(async (req, res) => {
    const files = (req.files as Express.Multer.File[]) || [];
    const userId = req.user?.userId || null;
    const result = await PersonalizedOrderServices.submitPersonalizedOrder(
        userId,
        req.body,
        files
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Personalized order submitted successfully",
        data: result,
    });
});

// Get All Personalized Orders (Admin)
const getAllPersonalizedOrders = catchAsync(async (req, res) => {
    const {
        keyword,
        orderStatus,
        occasion,
        ageGroup,
        budgetRange,
        city,
        state,
        userId,
        startDate,
        endDate,
        skip = "0",
        limit = "10",
    } = req.query;

    const filters = {
        keyword: keyword as string,
        orderStatus: orderStatus as string,
        occasion: occasion as string,
        ageGroup: ageGroup as string,
        budgetRange: budgetRange as string,
        city: city as string,
        state: state as string,
        userId: userId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const result = await PersonalizedOrderServices.getAllPersonalizedOrders(
        filters,
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Personalized orders fetched successfully",
        data: result,
    });
});

// Get Single Personalized Order
const getSinglePersonalizedOrderById = catchAsync(async (req, res) => {
    const { orderId } = req.params;

    const result = await PersonalizedOrderServices.getSinglePersonalizedOrderById(orderId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Personalized order fetched successfully",
        data: result,
    });
});

// Get My Personalized Orders
const getMyPersonalizedOrders = catchAsync(async (req, res) => {
    const { skip = "0", limit = "10" } = req.query;

    const result = await PersonalizedOrderServices.getMyPersonalizedOrders(
        req.user.userId,
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "My personalized orders fetched successfully",
        data: result,
    });
});

// Update Order
const updateOrder = catchAsync(async (req, res) => {
    const { orderId } = req.params;

    const result = await PersonalizedOrderServices.updateOrder(orderId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Order updated successfully",
        data: result,
    });
});

// Delete Personalized Order
const deletePersonalizedOrder = catchAsync(async (req, res) => {
    const { orderId } = req.params;

    const result = await PersonalizedOrderServices.deletePersonalizedOrder(orderId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Personalized order deleted successfully",
        data: result,
    });
});

export const PersonalizedOrderControllers = {
    submitPersonalizedOrder,
    getAllPersonalizedOrders,
    getSinglePersonalizedOrderById,
    getMyPersonalizedOrders,
    updateOrder,
    deletePersonalizedOrder,
};