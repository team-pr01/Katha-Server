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
exports.MaterialCategoryControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const materialCategory_service_1 = require("./materialCategory.service");
// Add
const addMaterialCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield materialCategory_service_1.MaterialCategoryServices.addMaterialCategory(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Material category added successfully",
        data: result,
    });
}));
// Get All
const getAllMaterialCategories = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, skip = "0", limit = "10" } = req.query;
    const result = yield materialCategory_service_1.MaterialCategoryServices.getAllMaterialCategories({ search }, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Material categories fetched successfully",
        data: result,
    });
}));
// Get Single
const getSingleMaterialCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield materialCategory_service_1.MaterialCategoryServices.getSingleMaterialCategory(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Material category fetched successfully",
        data: result,
    });
}));
// Update
const updateMaterialCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield materialCategory_service_1.MaterialCategoryServices.updateMaterialCategory(id, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Material category updated successfully",
        data: result,
    });
}));
// Delete
const deleteMaterialCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield materialCategory_service_1.MaterialCategoryServices.deleteMaterialCategory(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Material category deleted successfully",
        data: result,
    });
}));
exports.MaterialCategoryControllers = {
    addMaterialCategory,
    getAllMaterialCategories,
    getSingleMaterialCategory,
    updateMaterialCategory,
    deleteMaterialCategory,
};
