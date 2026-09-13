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
exports.AddressServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const address_model_1 = __importDefault(require("./address.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
// Add Address (one per user)
const addAddress = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user already has an address
    const existingAddress = yield address_model_1.default.findOne({ userId });
    if (existingAddress) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "You already have an address. Please update it instead.");
    }
    const address = yield address_model_1.default.create(Object.assign(Object.assign({}, payload), { userId }));
    return address;
});
// Get My Address
const getMyAddress = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const address = yield address_model_1.default.findOne({ userId });
    if (!address) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "No address found");
    }
    return address;
});
// Update Address
const updateAddress = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const address = yield address_model_1.default.findOne({ userId });
    if (!address) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "No address found to update");
    }
    const updatedAddress = yield address_model_1.default.findOneAndUpdate({ userId }, payload, { new: true, runValidators: true });
    return updatedAddress;
});
// Delete Address
const deleteAddress = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const address = yield address_model_1.default.findOne({ userId });
    if (!address) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "No address found to delete");
    }
    yield address_model_1.default.findOneAndDelete({ userId });
    return true;
});
// Get All Addresses (Admin)
const getAllAddresses = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: "i" } },
            { email: { $regex: filters.search, $options: "i" } },
            { phoneNumber: { $regex: filters.search, $options: "i" } },
            { addressLine1: { $regex: filters.search, $options: "i" } },
        ];
    }
    if (filters.city) {
        query.city = { $regex: filters.city, $options: "i" };
    }
    if (filters.state) {
        query.state = { $regex: filters.state, $options: "i" };
    }
    if (filters.pinCode) {
        query.pinCode = filters.pinCode;
    }
    if (filters.addressType) {
        query.addressType = filters.addressType;
    }
    const total = yield address_model_1.default.countDocuments(query);
    const addresses = yield address_model_1.default.find(query)
        .populate("userId", "name email phoneNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    return {
        data: addresses,
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
exports.AddressServices = {
    addAddress,
    getMyAddress,
    updateAddress,
    deleteAddress,
    getAllAddresses,
};
