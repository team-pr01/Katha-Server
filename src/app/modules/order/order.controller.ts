import httpStatus from "http-status";
import { OrderService } from "./order.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// Create Order
const createOrder = catchAsync(async (req, res) => {
    const userId = req.user?.userId || null;
    const result = await OrderService.createOrder(userId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Order created successfully",
        data: result,
    });
});

// Verify UPI Payment
const verifyPayment = catchAsync(async (req, res) => {
    const { orderId } = req.params;
    const { razorpayPaymentId } = req.body;

    const result = await OrderService.verifyPayment(orderId, razorpayPaymentId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment verified successfully",
        data: result,
    });
});

// Get All Orders
const getAllOrders = catchAsync(async (req, res) => {
    const {
        orderStatus,
        paymentStatus,
        userId,
        startDate,
        endDate,
        skip = "0",
        limit = "10",
    } = req.query;

    const filters = {
        orderStatus: orderStatus as string,
        paymentStatus: paymentStatus as string,
        userId: userId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const result = await OrderService.getAllOrders(
        filters,
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Orders fetched successfully",
        data: result,
    });
});

// Get Single Order
const getSingleOrder = catchAsync(async (req, res) => {
    const { orderId } = req.params;

    const result = await OrderService.getSingleOrder(orderId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Order fetched successfully",
        data: result,
    });
});

// Get My Orders
const getMyOrders = catchAsync(async (req, res) => {
    const { skip = "0", limit = "10" } = req.query;

    const result = await OrderService.getMyOrders(
        req.user.userId,
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "My orders fetched successfully",
        data: result,
    });
});

// Update Order Status
const updateOrderStatus = catchAsync(async (req, res) => {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const result = await OrderService.updateOrderStatus(orderId, orderStatus);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Order status updated successfully",
        data: result,
    });
});

// Update Payment Status
const updatePaymentStatus = catchAsync(async (req, res) => {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    const result = await OrderService.updatePaymentStatus(orderId, paymentStatus);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment status updated successfully",
        data: result,
    });
});

// Delete Order
const deleteOrder = catchAsync(async (req, res) => {
    const { orderId } = req.params;

    const result = await OrderService.deleteOrder(orderId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Order deleted successfully",
        data: result,
    });
});

export const OrderController = {
    createOrder,
    verifyPayment,
    getAllOrders,
    getSingleOrder,
    getMyOrders,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
};