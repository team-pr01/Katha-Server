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
exports.MaterialControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const materials_service_1 = require("./materials.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
// Add Material
const addMaterial = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield materials_service_1.MaterialServices.addMaterial(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Material added successfully",
        data: result,
    });
}));
// Get All Materials
const getAllMaterials = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, category, subCategory, madeOf, isActive, skip = "0", limit = "10", } = req.query;
    const filters = {
        search: search,
        category: category,
        subCategory: subCategory,
        madeOf: madeOf,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
    };
    const result = yield materials_service_1.MaterialServices.getAllMaterials(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Materials fetched successfully",
        data: result,
    });
}));
// Get Single Material
const getSingleMaterial = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { materialId } = req.params;
    const result = yield materials_service_1.MaterialServices.getSingleMaterial(materialId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Material fetched successfully",
        data: result,
    });
}));
// Update Material
const updateMaterial = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { materialId } = req.params;
    const result = yield materials_service_1.MaterialServices.updateMaterial(materialId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Material updated successfully",
        data: result,
    });
}));
// Delete Material
const deleteMaterial = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { materialId } = req.params;
    const result = yield materials_service_1.MaterialServices.deleteMaterial(materialId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Material deleted successfully",
        data: result,
    });
}));
// Add Variant
const addVariant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { materialId } = req.params;
    const result = yield materials_service_1.MaterialServices.addVariant(materialId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Variant added successfully",
        data: result,
    });
}));
// Update Variant
const updateVariant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { materialId, variantIndex } = req.params;
    const result = yield materials_service_1.MaterialServices.updateVariant(materialId, Number(variantIndex), req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Variant updated successfully",
        data: result,
    });
}));
// Remove Variant
const removeVariant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { materialId, variantIndex } = req.params;
    const result = yield materials_service_1.MaterialServices.removeVariant(materialId, Number(variantIndex));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Variant removed successfully",
        data: result,
    });
}));
exports.MaterialControllers = {
    addMaterial,
    getAllMaterials,
    getSingleMaterial,
    updateMaterial,
    deleteMaterial,
    addVariant,
    updateVariant,
    removeVariant,
};
