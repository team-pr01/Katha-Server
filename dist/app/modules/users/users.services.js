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
exports.UserServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const auth_model_1 = require("../auth/auth.model");
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const deleteImageFromCloudinary_1 = require("../../utils/deleteImageFromCloudinary");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const order_model_1 = __importDefault(require("../order/order.model"));
const address_model_1 = __importDefault(require("../address/address.model"));
// import AppError from "../../errors/AppError";
// import httpStatus from "http-status";
// import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
// import mongoose from "mongoose";
// import { calculateProfileSections } from "../../utils/calculateTutorProfileSections";
const getAllUsers = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    if (filters.keyword) {
        query.$or = [
            { email: { $regex: filters.keyword, $options: 'i' } },
        ];
    }
    /* TEXT SEARCH */
    if (filters.keyword) {
        query.$text = {
            $search: filters.keyword,
        };
    }
    /* FILTERS */
    if (filters.role)
        query.role = filters.role;
    if (filters.country)
        query.country = filters.country;
    if (filters.state)
        query.state = filters.state;
    if (filters.city)
        query.city = filters.city;
    if (filters.area)
        query.area = filters.area;
    /* STATUS LOGIC */
    if (filters.status && filters.status !== "all") {
        query.isSuspended = filters.status === "true";
    }
    if (filters.premiumUnlocked && filters.premiumUnlocked !== "all") {
        query.premiumUnlocked = filters.premiumUnlocked === "true";
    }
    return (0, infinitePaginate_1.infinitePaginate)(auth_model_1.User, query, skip, limit);
});
const getSingleUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_model_1.User.findById(userId);
    return result;
});
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const result = yield auth_model_1.User.findById(userId);
    return result;
});
// Suspend user - actual operation on User model
const suspendUser = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findByIdAndUpdate(userId, { isSuspended: true, suspensionReason: payload.suspensionReason });
    if (!user)
        throw new Error("User not found");
    return {};
});
const updateProfile = (userId, payload, file) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    let profilePicture = user.profilePicture;
    /* HANDLE IMAGE UPDATE */
    if (file) {
        /* DELETE OLD IMAGE */
        if (user.profilePicture) {
            const publicId = (0, deleteImageFromCloudinary_1.extractPublicId)(user.profilePicture);
            yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
        }
        /* UPLOAD NEW IMAGE */
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`profile-${Date.now()}`, file.path);
        profilePicture = secure_url;
    }
    const updatedUser = yield auth_model_1.User.findByIdAndUpdate(userId, Object.assign(Object.assign({}, payload), { profilePicture }), { new: true });
    return updatedUser;
});
// Activate user back
const withdrawSuspension = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findByIdAndUpdate(userId, { isSuspended: false, suspensionReason: null });
    if (!user)
        throw new Error("User not found");
    return {};
});
// Activate user back
const deleteAccount = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findByIdAndUpdate(userId, { isDeleted: true, accountDeleteReason: payload.accountDeleteReason });
    if (!user)
        throw new Error("User not found");
    return user;
});
// Activate user back
const restoreUsersDeletedAccount = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findByIdAndUpdate(userId, { isDeleted: false, accountDeleteReason: null });
    if (!user)
        throw new Error("User not found");
    return user;
});
// Change user role (For admin)
const saveUserPushToken = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findById(payload === null || payload === void 0 ? void 0 : payload.userId);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const result = yield auth_model_1.User.findByIdAndUpdate(payload.userId, { expoPushToken: payload.expoPushToken }, {
        new: true,
        runValidators: true,
    });
    return result;
});
// Get User Stats
const getUserStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate user exists
    const user = yield auth_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Fetch all counts in parallel
    const [totalOrders, shippedOrders, deliveredOrders, processingOrders, recentOrders, address,] = yield Promise.all([
        order_model_1.default.countDocuments({ userId }),
        order_model_1.default.countDocuments({ userId, orderStatus: "shipped" }),
        order_model_1.default.countDocuments({ userId, orderStatus: "delivered" }),
        order_model_1.default.countDocuments({ userId, orderStatus: "pending" }),
        order_model_1.default.find({ userId })
            .populate("orderedItems.productId", "name slug variants")
            .sort({ createdAt: -1 })
            .limit(3)
            .lean(),
        address_model_1.default.findOne({ userId }).lean(),
    ]);
    // Enrich recent orders with variant details
    const enrichedRecentOrders = recentOrders.map((order) => {
        const enrichedItems = order.orderedItems.map((item) => {
            const product = item.productId;
            let variant = null;
            if (product && product.variants && item.variantId) {
                variant = product.variants.find((v) => v._id.toString() === item.variantId.toString());
            }
            return Object.assign(Object.assign({}, item), { variant: variant
                    ? {
                        _id: variant._id,
                        name: variant.name,
                        images: variant.images || [],
                        size: variant.size,
                        color: variant.color,
                    }
                    : null, productId: product
                    ? {
                        _id: product._id,
                        name: product.name,
                        slug: product.slug,
                    }
                    : item.productId });
        });
        return {
            _id: order._id,
            orderId: order.orderId,
            totalAmount: order.totalAmount,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            itemCount: order.orderedItems.length,
            orderedItems: enrichedItems,
            createdAt: order.createdAt,
        };
    });
    // Build user profile
    const userProfile = {
        _id: user._id,
        name: user.name,
        email: user.email || null,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture || null,
        memberSince: user.createdAt,
    };
    // Build order stats
    const orderStats = {
        totalOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        processing: processingOrders,
    };
    return {
        user: userProfile,
        stats: orderStats,
        recentOrders: enrichedRecentOrders,
        deliveryAddress: address || null,
    };
});
exports.UserServices = {
    getAllUsers,
    getMe,
    suspendUser,
    withdrawSuspension,
    getSingleUserById,
    updateProfile,
    deleteAccount,
    restoreUsersDeletedAccount,
    saveUserPushToken,
    getUserStats
};
