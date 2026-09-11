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
exports.ProductControllers = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const product_service_1 = require("./product.service");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const addProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files || [];
    const result = yield product_service_1.ProductServices.addProduct(req.body, files);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Product added successfully",
        data: result,
    });
}));
/* Get All Products with Filtering and Sorting */
const getAllProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { category, subCategory, occasionNames, subOccasionNames, material, colors, minPrice, maxPrice, keyword, minRating, inStock, isFeatured, sortBy = 'newest', skip = "0", limit = "10" } = req.query;
    // Build filters object - Parse arrays from comma-separated strings
    const filters = {
        category: category ? category.split(',').map(c => c.trim()) : undefined,
        subCategory: subCategory ? subCategory.split(',').map(c => c.trim()) : undefined,
        occasionNames: occasionNames ? occasionNames.split(',').map(c => c.trim()) : undefined,
        subOccasionNames: subOccasionNames ? subOccasionNames.split(',').map(c => c.trim()) : undefined,
        material: material ? material.split(',').map(c => c.trim()) : undefined,
        colors: colors ? colors.split(',').map(c => c.trim()) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        keyword: keyword,
        minRating: minRating ? Number(minRating) : undefined,
        inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
    };
    // Build sort options
    const sortOption = { field: sortBy };
    const result = yield product_service_1.ProductServices.getAllProducts(filters, sortOption, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Products fetched successfully",
        data: result,
    });
}));
/* Get Single Product */
const getSingleProductById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield product_service_1.ProductServices.getSingleProductById(productId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product fetched successfully",
        data: result,
    });
}));
const getSingleProductBySlug = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { slug } = req.params;
    const result = yield product_service_1.ProductServices.getSingleProductBySlug(slug);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Product fetched successfully",
        data: result,
    });
}));
/* Update Product */
const updateProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const files = req.files || [];
    const updateData = __rest(req.body, []);
    const result = yield product_service_1.ProductServices.updateProduct(productId, updateData, files);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product updated successfully",
        data: result,
    });
}));
/* Delete Product */
const deleteProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield product_service_1.ProductServices.deleteProduct(productId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product deleted successfully",
        data: result,
    });
}));
/* Add Review */
const addReview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const files = req.files || [];
    let imageUrls = [];
    if (files.length) {
        // Upload review images (you can reuse the same utility)
        const uploads = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`review-${Date.now()}-${index}`, file.path);
            return secure_url;
        }));
        imageUrls = yield Promise.all(uploads);
    }
    const result = yield product_service_1.ProductServices.addReview(productId, req.user.userId, Number(rating), comment, imageUrls);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Review added successfully",
        data: result,
    });
}));
/* Get Product Reviews */
const getProductReviews = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const { skip = "0", limit = "10" } = req.query;
    const result = yield product_service_1.ProductServices.getProductReviews(productId, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product reviews fetched successfully",
        data: result,
    });
}));
exports.ProductControllers = {
    addProduct,
    getAllProducts,
    getSingleProductById,
    getSingleProductBySlug,
    updateProduct,
    deleteProduct,
    addReview,
    getProductReviews,
};
