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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OccasionControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const occasion_service_1 = require("./occasion.service");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
// Add Occasion
const addOccasion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    const result = yield occasion_service_1.OccasionServices.addOccasion(req.body, file);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Occasion added successfully",
        data: result,
    });
}));
// Get All Occasions
const getAllOccasions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, isActive, skip = "0", limit = "10" } = req.query;
    const filters = {
        search: search,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
    };
    const result = yield occasion_service_1.OccasionServices.getAllOccasions(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Occasions fetched successfully",
        data: result,
    });
}));
// Get Single Occasion
const getSingleOccasion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { occasionId } = req.params;
    const result = yield occasion_service_1.OccasionServices.getSingleOccasion(occasionId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Occasion fetched successfully",
        data: result,
    });
}));
// Update Occasion
const updateOccasion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { occasionId } = req.params;
    const file = req.file;
    const _a = req.body, { imagesToRemove } = _a, updateData = __rest(_a, ["imagesToRemove"]);
    const imagesToRemoveArray = imagesToRemove
        ? typeof imagesToRemove === "string"
            ? JSON.parse(imagesToRemove)
            : imagesToRemove
        : [];
    const result = yield occasion_service_1.OccasionServices.updateOccasion(occasionId, updateData, file, imagesToRemoveArray);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Occasion updated successfully",
        data: result,
    });
}));
// Delete Occasion
const deleteOccasion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { occasionId } = req.params;
    const result = yield occasion_service_1.OccasionServices.deleteOccasion(occasionId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Occasion deleted successfully",
        data: result,
    });
}));
// Add Sub-Occasion
const addSubOccasion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { occasionId } = req.params;
    const result = yield occasion_service_1.OccasionServices.addSubOccasion(occasionId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Sub-occasion added successfully",
        data: result,
    });
}));
// Remove Sub-Occasion
const removeSubOccasion = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { occasionId, subOccasionId } = req.params;
    const result = yield occasion_service_1.OccasionServices.removeSubOccasion(occasionId, subOccasionId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Sub-occasion removed successfully",
        data: result,
    });
}));
exports.OccasionControllers = {
    addOccasion,
    getAllOccasions,
    getSingleOccasion,
    updateOccasion,
    deleteOccasion,
    addSubOccasion,
    removeSubOccasion,
};
