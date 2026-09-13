"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalizedOrderControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const personalizedOrder_service_1 = require("./personalizedOrder.service");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
// Submit Personalized Order
const submitPersonalizedOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const files = req.files || [];
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || null;
    const result = yield personalizedOrder_service_1.PersonalizedOrderServices.submitPersonalizedOrder(userId, req.body, files);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Personalized order submitted successfully",
        data: result,
    });
}));
// Get All Personalized Orders (Admin)
const getAllPersonalizedOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { keyword, orderStatus, occasion, ageGroup, budgetRange, city, state, userId, startDate, endDate, skip = "0", limit = "10", } = req.query;
    const filters = {
        keyword: keyword,
        orderStatus: orderStatus,
        occasion: occasion,
        ageGroup: ageGroup,
        budgetRange: budgetRange,
        city: city,
        state: state,
        userId: userId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
    };
    const result = yield personalizedOrder_service_1.PersonalizedOrderServices.getAllPersonalizedOrders(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Personalized orders fetched successfully",
        data: result,
    });
}));
// Get Single Personalized Order
const getSinglePersonalizedOrderById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const result = yield personalizedOrder_service_1.PersonalizedOrderServices.getSinglePersonalizedOrderById(orderId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Personalized order fetched successfully",
        data: result,
    });
}));
// Get My Personalized Orders
const getMyPersonalizedOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { skip = "0", limit = "10" } = req.query;
    const result = yield personalizedOrder_service_1.PersonalizedOrderServices.getMyPersonalizedOrders(req.user.userId, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "My personalized orders fetched successfully",
        data: result,
    });
}));
// Update Order
const updateOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const result = yield personalizedOrder_service_1.PersonalizedOrderServices.updateOrder(orderId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Order updated successfully",
        data: result,
    });
}));
const updateOrderStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus } = req.body;
    const result = yield personalizedOrder_service_1.PersonalizedOrderServices.updateOrderStatus(orderId, {
        orderStatus,
        paymentStatus,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Order status updated successfully",
        data: result,
    });
}));
// Delete Personalized Order
const deletePersonalizedOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const result = yield personalizedOrder_service_1.PersonalizedOrderServices.deletePersonalizedOrder(orderId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Personalized order deleted successfully",
        data: result,
    });
}));
exports.PersonalizedOrderControllers = {
    submitPersonalizedOrder,
    getAllPersonalizedOrders,
    getSinglePersonalizedOrderById,
    getMyPersonalizedOrders,
    updateOrder,
    updateOrderStatus,
    deletePersonalizedOrder,
};
