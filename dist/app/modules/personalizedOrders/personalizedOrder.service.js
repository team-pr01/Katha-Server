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
exports.PersonalizedOrderServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const personalizedOrder_model_1 = __importDefault(require("./personalizedOrder.model"));
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const deleteImageFromCloudinary_1 = require("../../utils/deleteImageFromCloudinary");
// Helper to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    var _a;
    const publicId = (_a = url.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
    return publicId || null;
};
// Submit Personalized Order
const submitPersonalizedOrder = (userId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    // Upload reference images
    let referenceImageUrls = [];
    if (files && files.length > 0) {
        referenceImageUrls = yield Promise.all(files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`personalized-order-${Date.now()}-${index}`, file.path);
            return secure_url;
        })));
    }
    const orderData = Object.assign(Object.assign({}, payload), { referenceImages: referenceImageUrls, userId: userId || null, orderStatus: "pending" });
    const order = yield personalizedOrder_model_1.default.create(orderData);
    return order;
});
// Get All Personalized Orders (Admin)
const getAllPersonalizedOrders = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    // Search by customer name, email, phone, occasion, recipient name
    if (filters.keyword) {
        query.$or = [
            { fullName: { $regex: filters.keyword, $options: "i" } },
            { email: { $regex: filters.keyword, $options: "i" } },
            { phoneNumber: { $regex: filters.keyword, $options: "i" } },
            { recipientFulName: { $regex: filters.keyword, $options: "i" } },
            { occasion: { $regex: filters.keyword, $options: "i" } },
        ];
    }
    if (filters.orderStatus) {
        query.orderStatus = filters.orderStatus;
    }
    if (filters.occasion) {
        query.occasion = { $regex: filters.occasion, $options: "i" };
    }
    if (filters.ageGroup) {
        query.ageGroup = filters.ageGroup;
    }
    if (filters.budgetRange) {
        query.budgetRange = filters.budgetRange;
    }
    if (filters.city) {
        query.city = { $regex: filters.city, $options: "i" };
    }
    if (filters.state) {
        query.state = { $regex: filters.state, $options: "i" };
    }
    if (filters.userId) {
        query.userId = filters.userId;
    }
    if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate)
            query.createdAt.$gte = filters.startDate;
        if (filters.endDate)
            query.createdAt.$lte = filters.endDate;
    }
    const total = yield personalizedOrder_model_1.default.countDocuments(query);
    const orders = yield personalizedOrder_model_1.default.find(query)
        .populate("userId", "name email phoneNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    return {
        data: orders,
        meta: {
            total,
            filteredTotal: total,
            skip,
            limit,
            totalPages: Math.ceil(total / limit),
            currentPage: Math.floor(skip / limit) + 1,
            hasMore: skip + limit < total,
        },
    };
});
// Get Single Personalized Order by ID
const getSinglePersonalizedOrderById = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield personalizedOrder_model_1.default.findById(orderId)
        .populate("userId", "name email phoneNumber")
        .lean();
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Personalized order not found");
    }
    return order;
});
// Get My Personalized Orders (User)
const getMyPersonalizedOrders = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, skip = 0, limit = 10) {
    const query = { userId };
    const total = yield personalizedOrder_model_1.default.countDocuments(query);
    const orders = yield personalizedOrder_model_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    return {
        data: orders,
        meta: {
            total,
            filteredTotal: total,
            skip,
            limit,
            totalPages: Math.ceil(total / limit),
            currentPage: Math.floor(skip / limit) + 1,
            hasMore: skip + limit < total,
        },
    };
});
// Update Order Status
const updateOrder = (orderId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield personalizedOrder_model_1.default.findById(orderId);
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Personalized order not found");
    }
    if (!payload || Object.keys(payload).length === 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "No fields to update");
    }
    const updatedOrder = yield personalizedOrder_model_1.default.findByIdAndUpdate(orderId, payload, { new: true });
    return updatedOrder;
});
// Delete Personalized Order (Delete reference images too)
const deletePersonalizedOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield personalizedOrder_model_1.default.findById(orderId);
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Personalized order not found");
    }
    // Delete reference images from Cloudinary
    if (order.referenceImages && order.referenceImages.length > 0) {
        yield Promise.all(order.referenceImages.map((url) => __awaiter(void 0, void 0, void 0, function* () {
            const publicId = getPublicIdFromUrl(url);
            if (publicId) {
                yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
            }
        })));
    }
    yield personalizedOrder_model_1.default.findByIdAndDelete(orderId);
    return true;
});
exports.PersonalizedOrderServices = {
    submitPersonalizedOrder,
    getAllPersonalizedOrders,
    getSinglePersonalizedOrderById,
    getMyPersonalizedOrders,
    updateOrder,
    deletePersonalizedOrder,
};
