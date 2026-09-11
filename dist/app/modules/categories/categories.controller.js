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
exports.CategoryControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const categories_services_1 = require("./categories.services");
// Add category
const addCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    const result = yield categories_services_1.CategoryServices.addCategory(req.body, file);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Category added successfully",
        data: result,
    });
}));
// Get all categories
const getAllCategories = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, areaName, isActive, skip = "0", limit = "10" } = req.query;
    const filters = {
        search: search,
        areaName: areaName,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
    };
    const result = yield categories_services_1.CategoryServices.getAllCategories(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Categories fetched successfully",
        data: result,
    });
}));
// Get categories by area name
const getCategoriesByAreaName = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { areaName } = req.params;
    const { skip = "0", limit = "10" } = req.query;
    const result = yield categories_services_1.CategoryServices.getCategoriesByAreaName(areaName, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Categories fetched successfully",
        data: result,
    });
}));
// Get single category
const getSingleCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryId } = req.params;
    const result = yield categories_services_1.CategoryServices.getSingleCategoryById(categoryId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Category fetched successfully",
        data: result,
    });
}));
// Update category
const updateCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryId } = req.params;
    const file = req.file;
    const _a = req.body, { imagesToRemove } = _a, updateData = __rest(_a, ["imagesToRemove"]);
    const imagesToRemoveArray = imagesToRemove
        ? typeof imagesToRemove === "string"
            ? JSON.parse(imagesToRemove)
            : imagesToRemove
        : [];
    const result = yield categories_services_1.CategoryServices.updateCategory(categoryId, updateData, file, imagesToRemoveArray);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Category updated successfully",
        data: result,
    });
}));
// Delete category
const deleteCategory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categoryId } = req.params;
    const result = yield categories_services_1.CategoryServices.deleteCategory(categoryId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Category deleted successfully",
        data: result,
    });
}));
exports.CategoryControllers = {
    addCategory,
    getAllCategories,
    getCategoriesByAreaName,
    getSingleCategory,
    updateCategory,
    deleteCategory,
};
