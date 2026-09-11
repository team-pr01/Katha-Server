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
exports.CategoryServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const categories_model_1 = __importDefault(require("./categories.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const deleteImageFromCloudinary_1 = require("../../utils/deleteImageFromCloudinary");
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const product_model_1 = __importDefault(require("../product/product.model"));
// Add a category with image upload
const addCategory = (payload, file) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if category already exists
    const existingCategory = yield categories_model_1.default.findOne({
        name: { $regex: new RegExp(`^${payload.name}$`, "i") },
    });
    if (existingCategory) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Category already exists");
    }
    // Upload image to Cloudinary
    let imageUrl = "";
    if (file) {
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`category-${Date.now()}`, file.path);
        imageUrl = secure_url;
    }
    else if (!payload.imageUrl) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Category image is required");
    }
    // Parse subCategories if it's a string
    let subCategories = [];
    if (payload.subCategories) {
        if (typeof payload.subCategories === "string") {
            const rawSubCategories = String(payload.subCategories).trim();
            try {
                const parsedSubCategories = JSON.parse(rawSubCategories);
                if (Array.isArray(parsedSubCategories)) {
                    subCategories = parsedSubCategories
                        .map((item) => String(item).trim())
                        .filter(Boolean);
                }
                else if (typeof parsedSubCategories === "string") {
                    subCategories = parsedSubCategories
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean);
                }
            }
            catch (_a) {
                // If JSON parse fails, try splitting by comma
                subCategories = rawSubCategories
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean);
            }
        }
        else if (Array.isArray(payload.subCategories)) {
            subCategories = payload.subCategories
                .map((item) => String(item).trim())
                .filter(Boolean);
        }
    }
    const categoryData = {
        name: payload.name,
        areaName: payload.areaName,
        description: payload.description,
        imageUrl: imageUrl || payload.imageUrl,
        subCategories: subCategories,
        isActive: payload.isActive !== undefined ? payload.isActive : true,
    };
    const result = yield categories_model_1.default.create(categoryData);
    return result;
});
// Get all categories with filters and pagination
const getAllCategories = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    // Apply filters
    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }
    if (filters.areaName) {
        query.areaName = { $regex: new RegExp(`^${filters.areaName}$`, "i") };
    }
    if (filters.search) {
        query.$text = {
            $search: filters.search,
        };
    }
    // Get categories with pagination
    const categories = yield categories_model_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    const total = yield categories_model_1.default.countDocuments(query);
    // Get product counts for each category
    const categoriesWithCounts = yield Promise.all(categories.map((category) => __awaiter(void 0, void 0, void 0, function* () {
        // Count products for this category
        const productCount = yield product_model_1.default.countDocuments({
            category: category.name,
            isActive: true,
        });
        // Get sub-category product counts
        let subCategoryCounts = [];
        if (category.subCategories && category.subCategories.length > 0) {
            subCategoryCounts = yield Promise.all(category.subCategories.map((subCategory) => __awaiter(void 0, void 0, void 0, function* () {
                const count = yield product_model_1.default.countDocuments({
                    category: category.name,
                    subCategory: subCategory,
                    isActive: true,
                });
                return {
                    name: subCategory,
                    productCount: count,
                };
            })));
        }
        return Object.assign(Object.assign({}, category), { productCount, subCategories: subCategoryCounts.length > 0 ? subCategoryCounts : category.subCategories });
    })));
    return {
        data: categoriesWithCounts,
        meta: {
            total,
            pages: Math.ceil(total / limit),
            currentPage: Math.floor(skip / limit) + 1,
            limit,
            skip,
        },
    };
});
// Get categories by area name (with pagination)
const getCategoriesByAreaName = (areaName_1, ...args_1) => __awaiter(void 0, [areaName_1, ...args_1], void 0, function* (areaName, skip = 0, limit = 10) {
    const query = {
        areaName: { $regex: new RegExp(`^${areaName}$`, "i") },
        isActive: true,
    };
    // Get categories with pagination using infinitePaginate
    const result = yield (0, infinitePaginate_1.infinitePaginate)(categories_model_1.default, query, skip, limit, [], // populate options
    { name: 1 } // sort criteria (alphabetical)
    );
    // Get product counts for each category
    const categoriesWithCounts = yield Promise.all(result.data.map((category) => __awaiter(void 0, void 0, void 0, function* () {
        // Count products for this category
        const productCount = yield product_model_1.default.countDocuments({
            category: category.name,
            isActive: true,
        });
        // Get sub-category product counts
        let subCategoryCounts = [];
        if (category.subCategories && category.subCategories.length > 0) {
            subCategoryCounts = yield Promise.all(category.subCategories.map((subCategory) => __awaiter(void 0, void 0, void 0, function* () {
                const count = yield product_model_1.default.countDocuments({
                    category: category.name,
                    subCategory: subCategory,
                    isActive: true,
                });
                return {
                    name: subCategory,
                    productCount: count,
                };
            })));
        }
        return Object.assign(Object.assign({}, category), { productCount, subCategories: subCategoryCounts.length > 0 ? subCategoryCounts : category.subCategories });
    })));
    return Object.assign(Object.assign({}, result), { data: categoriesWithCounts });
});
// Get single category by ID
const getSingleCategoryById = (categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield categories_model_1.default.findById(categoryId);
    if (!category) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Category not found");
    }
    // Get product count for this category
    const productCount = yield product_model_1.default.countDocuments({
        category: category.name,
        isActive: true,
    });
    // Get sub-category product counts
    let subCategoryCounts = [];
    if (category.subCategories && category.subCategories.length > 0) {
        subCategoryCounts = yield Promise.all(category.subCategories.map((subCategory) => __awaiter(void 0, void 0, void 0, function* () {
            const count = yield product_model_1.default.countDocuments({
                category: category.name,
                subCategory: subCategory,
                isActive: true,
            });
            return {
                name: subCategory,
                productCount: count,
            };
        })));
    }
    return Object.assign(Object.assign({}, category.toObject()), { productCount, subCategories: subCategoryCounts.length > 0 ? subCategoryCounts : category.subCategories });
});
// Get single category by name with product count
const getCategoryByName = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield categories_model_1.default.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        isActive: true,
    });
    if (!category) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Category not found");
    }
    // Get product count for this category
    const productCount = yield product_model_1.default.countDocuments({
        category: category.name,
        isActive: true,
    });
    // Get sub-category product counts
    let subCategoryCounts = [];
    if (category.subCategories && category.subCategories.length > 0) {
        subCategoryCounts = yield Promise.all(category.subCategories.map((subCategory) => __awaiter(void 0, void 0, void 0, function* () {
            const count = yield product_model_1.default.countDocuments({
                category: category.name,
                subCategory: subCategory,
                isActive: true,
            });
            return {
                name: subCategory,
                productCount: count,
            };
        })));
    }
    return Object.assign(Object.assign({}, category.toObject()), { productCount, subCategories: subCategoryCounts.length > 0 ? subCategoryCounts : category.subCategories });
});
// Update category
const updateCategory = (categoryId, payload, file, imagesToRemove) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const category = yield categories_model_1.default.findById(categoryId);
    if (!category) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Category not found");
    }
    // Handle image update
    let imageUrl = category.imageUrl;
    // Remove old image if requested
    if (imagesToRemove && imagesToRemove.length > 0) {
        const publicId = (_a = category.imageUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
        if (publicId) {
            yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
        }
        imageUrl = "";
    }
    // Upload new image if provided
    if (file) {
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`category-${Date.now()}`, file.path);
        imageUrl = secure_url;
    }
    const updatedCategory = yield categories_model_1.default.findByIdAndUpdate(categoryId, Object.assign(Object.assign({}, payload), { imageUrl: imageUrl || payload.imageUrl }), { new: true });
    return updatedCategory;
});
// Delete category
const deleteCategory = (categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const category = yield categories_model_1.default.findById(categoryId);
    if (!category) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Category not found");
    }
    // Delete image from Cloudinary
    if (category.imageUrl) {
        const publicId = (_a = category.imageUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
        if (publicId) {
            yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
        }
    }
    // Check if any products are using this category
    // If you have a Product model, you can check here
    // const productCount = await Product.countDocuments({ category: category.name });
    // if (productCount > 0) {
    //   throw new AppError(httpStatus.CONFLICT, `Cannot delete category. ${productCount} products are associated with it.`);
    // }
    yield categories_model_1.default.findByIdAndDelete(categoryId);
    return true;
});
exports.CategoryServices = {
    addCategory,
    getAllCategories,
    getCategoriesByAreaName,
    getSingleCategoryById,
    getCategoryByName,
    updateCategory,
    deleteCategory,
};
