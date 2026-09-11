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
exports.OccasionServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const occasion_model_1 = __importDefault(require("./occasion.model"));
const product_model_1 = __importDefault(require("../product/product.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const deleteImageFromCloudinary_1 = require("../../utils/deleteImageFromCloudinary");
// Add Occasion
const addOccasion = (payload, file) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if occasion already exists
    const existingOccasion = yield occasion_model_1.default.findOne({
        name: { $regex: new RegExp(`^${payload.name}$`, "i") },
    });
    if (existingOccasion) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Occasion already exists");
    }
    // Upload image to Cloudinary
    let imageUrl = "";
    if (file) {
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`occasion-${Date.now()}`, file.path);
        imageUrl = secure_url;
    }
    // Process sub-occasions - Handle both array and JSON string
    let subOccasions = [];
    if (payload.subOccasions) {
        // If it's a string, parse it as JSON
        if (typeof payload.subOccasions === 'string') {
            try {
                subOccasions = JSON.parse(payload.subOccasions);
            }
            catch (error) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid subOccasions format. Must be a valid JSON array");
            }
        }
        // If it's already an array, use it directly
        else if (Array.isArray(payload.subOccasions)) {
            subOccasions = payload.subOccasions;
        }
        else {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "subOccasions must be an array or JSON string");
        }
    }
    // Clean up sub-occasions
    const processedSubOccasions = subOccasions.map((sub) => ({
        name: sub.name,
        description: sub.description || '',
        imageUrl: sub.imageUrl || '',
        _id: undefined, // Let MongoDB generate the ID
    }));
    const occasionData = {
        name: payload.name,
        description: payload.description,
        imageUrl: imageUrl || payload.imageUrl,
        subOccasions: processedSubOccasions,
        isActive: payload.isActive !== undefined ? payload.isActive : true,
    };
    const occasion = yield occasion_model_1.default.create(occasionData);
    return occasion;
});
// Get All Occasions with Products Count
const getAllOccasions = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    // Apply filters
    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }
    if (filters.search) {
        query.$text = {
            $search: filters.search,
        };
    }
    // Get occasions with pagination
    const occasions = yield occasion_model_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    const total = yield occasion_model_1.default.countDocuments(query);
    // Get product counts for each occasion
    const occasionsWithCounts = yield Promise.all(occasions.map((occasion) => __awaiter(void 0, void 0, void 0, function* () {
        // Count products for this occasion - using $in with occasionNames array
        const productCount = yield product_model_1.default.countDocuments({
            occasionNames: { $in: [occasion.name] },
            isActive: true,
        });
        // Get sub-occasion product counts
        const subOccasionCounts = yield Promise.all(occasion.subOccasions.map((sub) => __awaiter(void 0, void 0, void 0, function* () {
            const count = yield product_model_1.default.countDocuments({
                occasionNames: { $in: [occasion.name] },
                subOccasionNames: { $in: [sub.name] },
                isActive: true,
            });
            return Object.assign(Object.assign({}, sub), { productCount: count });
        })));
        return Object.assign(Object.assign({}, occasion), { productCount, subOccasions: subOccasionCounts });
    })));
    return {
        data: occasionsWithCounts,
        meta: {
            total,
            pages: Math.ceil(total / limit),
            currentPage: Math.floor(skip / limit) + 1,
            limit,
            skip,
        },
    };
});
// Get Single Occasion with Products
const getSingleOccasion = (occasionId) => __awaiter(void 0, void 0, void 0, function* () {
    const occasion = yield occasion_model_1.default.findById(occasionId).lean();
    if (!occasion) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Occasion not found");
    }
    // Get products for this occasion
    const products = yield product_model_1.default.find({
        occasion: occasion.name,
        isActive: true,
    })
        .select("name images minPrice maxPrice averageRating soldCount")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    // Get sub-occasion products
    const subOccasionProducts = yield Promise.all(occasion.subOccasions.map((sub) => __awaiter(void 0, void 0, void 0, function* () {
        const subProducts = yield product_model_1.default.find({
            occasion: occasion.name,
            subOccasion: sub.name,
            isActive: true,
        })
            .select("name images minPrice maxPrice averageRating soldCount")
            .limit(10)
            .lean();
        return Object.assign(Object.assign({}, sub), { products: subProducts, productCount: subProducts.length });
    })));
    return Object.assign(Object.assign({}, occasion), { products, productCount: products.length, subOccasions: subOccasionProducts });
});
// Update Occasion
const updateOccasion = (occasionId, payload, file, imagesToRemove) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const occasion = yield occasion_model_1.default.findById(occasionId);
    if (!occasion) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Occasion not found");
    }
    // Handle image update
    let imageUrl = occasion.imageUrl;
    // Remove old image if requested
    if (imagesToRemove && imagesToRemove.length > 0) {
        const publicId = (_a = occasion.imageUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
        if (publicId) {
            yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
        }
        imageUrl = "";
    }
    // Upload new image if provided
    if (file) {
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`occasion-${Date.now()}`, file.path);
        imageUrl = secure_url;
    }
    // Update sub-occasions if provided
    let subOccasions = occasion.subOccasions;
    if (payload.subOccasions) {
        subOccasions = payload.subOccasions.map((sub) => (Object.assign(Object.assign({}, sub), { _id: sub._id || undefined })));
    }
    const updatedOccasion = yield occasion_model_1.default.findByIdAndUpdate(occasionId, Object.assign(Object.assign({}, payload), { imageUrl: imageUrl || payload.imageUrl, subOccasions }), { new: true });
    return updatedOccasion;
});
// Delete Occasion
const deleteOccasion = (occasionId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const occasion = yield occasion_model_1.default.findById(occasionId);
    if (!occasion) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Occasion not found");
    }
    // Check if any products are using this occasion
    const productCount = yield product_model_1.default.countDocuments({
        occasion: occasion.name,
    });
    if (productCount > 0) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, `Cannot delete occasion. ${productCount} products are associated with this occasion. Please reassign or delete the products first.`);
    }
    // Delete image from Cloudinary
    if (occasion.imageUrl) {
        const publicId = (_a = occasion.imageUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
        if (publicId) {
            yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
        }
    }
    yield occasion_model_1.default.findByIdAndDelete(occasionId);
    return true;
});
// Add Sub-Occasion to an existing occasion
const addSubOccasion = (occasionId, subOccasionData) => __awaiter(void 0, void 0, void 0, function* () {
    const occasion = yield occasion_model_1.default.findById(occasionId);
    if (!occasion) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Occasion not found");
    }
    // Check if sub-occasion already exists
    const subExists = occasion.subOccasions.some((sub) => { var _a; return sub.name.toLowerCase() === ((_a = subOccasionData.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()); });
    if (subExists) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Sub-occasion already exists");
    }
    const newSubOccasion = Object.assign({}, subOccasionData);
    occasion.subOccasions.push(newSubOccasion);
    yield occasion.save();
    return occasion;
});
// Remove Sub-Occasion
const removeSubOccasion = (occasionId, subOccasionId) => __awaiter(void 0, void 0, void 0, function* () {
    const occasion = yield occasion_model_1.default.findById(occasionId);
    if (!occasion) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Occasion not found");
    }
    // Find the sub-occasion to get its image
    const subOccasion = occasion.subOccasions.find((sub) => { var _a; return ((_a = sub._id) === null || _a === void 0 ? void 0 : _a.toString()) === subOccasionId; });
    if (!subOccasion) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Sub-occasion not found");
    }
    // Remove sub-occasion from array
    occasion.subOccasions = occasion.subOccasions.filter((sub) => { var _a; return ((_a = sub._id) === null || _a === void 0 ? void 0 : _a.toString()) !== subOccasionId; });
    yield occasion.save();
    return occasion;
});
exports.OccasionServices = {
    addOccasion,
    getAllOccasions,
    getSingleOccasion,
    updateOccasion,
    deleteOccasion,
    addSubOccasion,
    removeSubOccasion,
};
