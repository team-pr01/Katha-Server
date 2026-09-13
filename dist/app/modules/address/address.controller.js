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
exports.AddressControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const address_service_1 = require("./address.service");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
// Add Address
const addAddress = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield address_service_1.AddressServices.addAddress(req.user.userId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Address added successfully",
        data: result,
    });
}));
// Get My Address
const getMyAddress = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield address_service_1.AddressServices.getMyAddress(req.user.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Address fetched successfully",
        data: result,
    });
}));
// Update Address
const updateAddress = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield address_service_1.AddressServices.updateAddress(req.user.userId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Address updated successfully",
        data: result,
    });
}));
// Delete Address
const deleteAddress = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield address_service_1.AddressServices.deleteAddress(req.user.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Address deleted successfully",
        data: result,
    });
}));
// Get All Addresses (Admin)
const getAllAddresses = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, city, state, pinCode, addressType, skip = "0", limit = "10", } = req.query;
    const filters = {
        search: search,
        city: city,
        state: state,
        pinCode: pinCode,
        addressType: addressType,
    };
    const result = yield address_service_1.AddressServices.getAllAddresses(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Addresses fetched successfully",
        data: result,
    });
}));
exports.AddressControllers = {
    addAddress,
    getMyAddress,
    updateAddress,
    deleteAddress,
    getAllAddresses,
};
