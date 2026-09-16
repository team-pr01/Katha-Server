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
exports.ProductVariantControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const productVariant_service_1 = require("./productVariant.service");
// Add Variant to Product
const addVariant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const files = req.files || [];
    const result = yield productVariant_service_1.ProductVariantServices.addVariant(productId, req.body, files);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Variant added successfully",
        data: result,
    });
}));
// Get All Variants of a Product
const getAllVariantsOfAProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield productVariant_service_1.ProductVariantServices.getAllVariantsOfAProduct(productId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Variants fetched successfully",
        data: result,
    });
}));
// Get Single Variant
const getSingleVariantOfAProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, variantId } = req.params;
    const result = yield productVariant_service_1.ProductVariantServices.getSingleVariantOfAProduct(productId, variantId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Variant fetched successfully",
        data: result,
    });
}));
// Update Variant
const updateVariant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, variantId } = req.params;
    const files = req.files || [];
    const _a = req.body, { imagesToRemove } = _a, updateData = __rest(_a, ["imagesToRemove"]);
    const imagesToRemoveArray = imagesToRemove
        ? typeof imagesToRemove === "string"
            ? JSON.parse(imagesToRemove)
            : imagesToRemove
        : [];
    const result = yield productVariant_service_1.ProductVariantServices.updateVariant(productId, variantId, updateData, files, imagesToRemoveArray);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Variant updated successfully",
        data: result,
    });
}));
// Delete Variant
const deleteVariant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, variantId } = req.params;
    const result = yield productVariant_service_1.ProductVariantServices.deleteVariant(productId, variantId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Variant deleted successfully",
        data: result,
    });
}));
exports.ProductVariantControllers = {
    addVariant,
    getAllVariantsOfAProduct,
    getSingleVariantOfAProduct,
    updateVariant,
    deleteVariant,
};
