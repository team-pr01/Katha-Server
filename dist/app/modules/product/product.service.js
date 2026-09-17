"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.ProductServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const product_model_1 = __importStar(require("./product.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const deleteImageFromCloudinary_1 = require("../../utils/deleteImageFromCloudinary");
const materials_model_1 = __importDefault(require("../materials/materials.model"));
const mongoose_1 = __importDefault(require("mongoose"));
// Helper function to calculate product price range
const calculatePriceRange = (variants) => {
    if (!variants || variants.length === 0) {
        return {
            minPrice: 0,
            maxPrice: 0,
            minDiscountedPrice: undefined,
        };
    }
    const prices = variants.map((v) => v.basePrice);
    const discountedPrices = variants
        .map((v) => v.discountedPrice)
        .filter((p) => p !== undefined && p !== null);
    return {
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        minDiscountedPrice: discountedPrices.length > 0
            ? Math.min(...discountedPrices)
            : undefined,
    };
};
const addProduct = (payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    // =========================================================
    // 1. Upload Product/Variant Images
    // =========================================================
    let imageUrls = [];
    if (files === null || files === void 0 ? void 0 : files.length) {
        const uploads = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`product-${Date.now()}-${index}`, file.path);
            return secure_url;
        }));
        imageUrls = yield Promise.all(uploads);
    }
    // =========================================================
    // 2. Parse Variants
    // =========================================================
    let variants = payload.variants || [];
    if (typeof variants === "string") {
        try {
            variants = JSON.parse(variants);
        }
        catch (_a) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid variants format");
        }
    }
    // =========================================================
    // 3. Process Variants
    // =========================================================
    variants = variants.map((variant, index) => {
        // -----------------------------
        // Parse Materials
        // -----------------------------
        let materials = variant.materials || [];
        if (typeof materials === "string") {
            try {
                materials = JSON.parse(materials);
            }
            catch (_a) {
                materials = [];
            }
        }
        if (!Array.isArray(materials)) {
            materials = [materials];
        }
        materials = materials
            .filter((material) => material &&
            material.materialId &&
            material.materialVariantId)
            .map((material) => ({
            materialId: material.materialId,
            materialVariantId: material.materialVariantId,
            quantity: Number(material.quantity) || 0,
            unit: material.unit || "piece",
        }));
        // -----------------------------
        // Validate Dimensions
        // -----------------------------
        const dimensions = variant.dimensions;
        if (!dimensions ||
            dimensions.length === undefined ||
            dimensions.width === undefined ||
            dimensions.height === undefined) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Dimensions are required for variant ${index + 1}`);
        }
        // -----------------------------
        // Return Variant
        // -----------------------------
        return {
            name: variant.name,
            description: variant.description,
            packageContents: Array.isArray(variant.packageContents)
                ? variant.packageContents
                : [],
            images: imageUrls,
            design: variant.design,
            size: variant.size,
            color: variant.color,
            packSize: variant.packSize || "Single",
            dimensions: {
                length: Number(dimensions.length),
                width: Number(dimensions.width),
                height: Number(dimensions.height),
                unit: dimensions.unit || "cm",
            },
            weight: variant.weight,
            basePrice: Number(variant.basePrice),
            discountedPrice: variant.discountedPrice !== undefined &&
                variant.discountedPrice !== null
                ? Number(variant.discountedPrice)
                : undefined,
            bulkPrice: variant.bulkPrice !== undefined &&
                variant.bulkPrice !== null
                ? Number(variant.bulkPrice)
                : undefined,
            stock: variant.stock !== undefined &&
                variant.stock !== null
                ? Number(variant.stock)
                : 0,
            materials,
        };
    });
    // =========================================================
    // 4. Calculate Price Range
    // =========================================================
    const { minPrice, maxPrice, minDiscountedPrice, } = calculatePriceRange(variants);
    // =========================================================
    // 5. Parse Occasion Names
    // =========================================================
    let occasionNames = payload.occasionNames || [];
    if (typeof occasionNames === "string") {
        try {
            occasionNames = JSON.parse(occasionNames);
        }
        catch (_b) {
            occasionNames = occasionNames
                .split(",")
                .map((name) => name.trim());
        }
    }
    if (!Array.isArray(occasionNames)) {
        occasionNames = [occasionNames];
    }
    occasionNames = occasionNames.filter((name) => name && name.trim() !== "");
    if (occasionNames.length === 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "At least one occasion is required");
    }
    // =========================================================
    // 6. Parse Sub Occasion Names
    // =========================================================
    let subOccasionNames = payload.subOccasionNames || [];
    if (typeof subOccasionNames === "string") {
        try {
            subOccasionNames = JSON.parse(subOccasionNames);
        }
        catch (_c) {
            subOccasionNames = subOccasionNames
                .split(",")
                .map((name) => name.trim());
        }
    }
    if (!Array.isArray(subOccasionNames)) {
        subOccasionNames = [subOccasionNames];
    }
    subOccasionNames = subOccasionNames.filter((name) => name && name.trim() !== "");
    // =========================================================
    // 7. Parse Tags
    // =========================================================
    let tags = payload.tags || [];
    if (typeof tags === "string") {
        try {
            tags = JSON.parse(tags);
        }
        catch (_d) {
            tags = tags
                .split(",")
                .map((tag) => tag.trim());
        }
    }
    if (!Array.isArray(tags)) {
        tags = [tags];
    }
    tags = tags.filter((tag) => tag && tag.trim() !== "");
    // =========================================================
    // 8. Parse Care Instructions
    // =========================================================
    let careInstructions = payload.careInstructions || [];
    if (typeof careInstructions === "string") {
        try {
            careInstructions = JSON.parse(careInstructions);
        }
        catch (_e) {
            careInstructions = careInstructions
                .split(",")
                .map((instruction) => instruction.trim());
        }
    }
    if (!Array.isArray(careInstructions)) {
        careInstructions = [careInstructions];
    }
    careInstructions = careInstructions.filter((instruction) => instruction && instruction.trim() !== "");
    // =========================================================
    // 9. Parse Customization
    // =========================================================
    let isCustomizationAvailable = false;
    if (payload.isCustomizationAvailable !== undefined) {
        if (typeof payload.isCustomizationAvailable === "string") {
            isCustomizationAvailable =
                payload.isCustomizationAvailable.toLowerCase() === "true";
        }
        else {
            isCustomizationAvailable = Boolean(payload.isCustomizationAvailable);
        }
    }
    // =========================================================
    // 10. Processing Time
    // =========================================================
    const processingTime = payload.processingTime &&
        String(payload.processingTime).trim() !== ""
        ? payload.processingTime
        : null;
    // =========================================================
    // 11. Boolean Fields
    // =========================================================
    let isActive = true;
    if (payload.isActive !== undefined) {
        if (typeof payload.isActive === "string") {
            isActive = payload.isActive.toLowerCase() === "true";
        }
        else {
            isActive = Boolean(payload.isActive);
        }
    }
    let isFeatured = false;
    if (payload.isFeatured !== undefined) {
        if (typeof payload.isFeatured === "string") {
            isFeatured = payload.isFeatured.toLowerCase() === "true";
        }
        else {
            isFeatured = Boolean(payload.isFeatured);
        }
    }
    // =========================================================
    // 12. Create Product Data
    // =========================================================
    const productData = {
        name: payload.name,
        category: payload.category,
        subCategory: payload.subCategory,
        occasionNames,
        subOccasionNames,
        careInstructions,
        isCustomizationAvailable,
        processingTime,
        variants,
        minPrice,
        maxPrice,
        minDiscountedPrice,
        tags,
        isActive,
        isFeatured,
    };
    // =========================================================
    // 13. Create Product
    // =========================================================
    const product = yield product_model_1.default.create(productData);
    return product;
});
/* Get All Products with Advanced Filtering and Sorting */
const getAllProducts = (filters_1, ...args_1) => __awaiter(void 0, [filters_1, ...args_1], void 0, function* (filters, sortOption = { field: 'latest' }, skip = 0, limit = 10) {
    console.log(filters);
    const query = { isActive: true };
    // Category filter - Support array
    if (filters.category && filters.category.length > 0) {
        query.category = {
            $in: filters.category.map((cat) => new RegExp(`^${cat}$`, 'i'))
        };
    }
    // SubCategory filter - Support array
    if (filters.subCategory && filters.subCategory.length > 0) {
        query.subCategory = {
            $in: filters.subCategory.map((sub) => new RegExp(`^${sub}$`, 'i'))
        };
    }
    // Occasion names filter - Support array
    if (filters.occasionNames && filters.occasionNames.length > 0) {
        query.occasionNames = {
            $in: filters.occasionNames.map((name) => new RegExp(`^${name}$`, 'i'))
        };
    }
    // Sub-occasion names filter - Support array
    if (filters.subOccasionNames && filters.subOccasionNames.length > 0) {
        query.subOccasionNames = {
            $in: filters.subOccasionNames.map((name) => new RegExp(`^${name}$`, 'i'))
        };
    }
    // CORRECT: Material filter using ObjectId
    if (filters.material && filters.material.length > 0) {
        // Convert string IDs to ObjectIds
        const materialObjectIds = filters.material.map((id) => new mongoose_1.default.Types.ObjectId(id));
        query['variants.materials.materialId'] = {
            $in: materialObjectIds
        };
    }
    // Color filter - Search in variants.color (singular)
    if (filters.colors && filters.colors.length > 0) {
        query['variants.color'] = {
            $in: filters.colors.map((color) => new RegExp(`^${color}$`, 'i'))
        };
    }
    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const priceConditions = [];
        const priceCondition = {};
        if (filters.minPrice !== undefined)
            priceCondition.$gte = filters.minPrice;
        if (filters.maxPrice !== undefined)
            priceCondition.$lte = filters.maxPrice;
        if (Object.keys(priceCondition).length > 0) {
            priceConditions.push({ minPrice: priceCondition });
            priceConditions.push({ minDiscountedPrice: priceCondition });
        }
        if (priceConditions.length > 0) {
            query.$or = priceConditions;
        }
    }
    // Rating filter
    if (filters.minRating) {
        query.averageRating = { $gte: filters.minRating };
    }
    // In stock filter
    if (filters.inStock !== undefined) {
        query['variants'] = {
            $elemMatch: {
                stock: filters.inStock ? { $gt: 0 } : { $eq: 0 }
            }
        };
    }
    // Featured filter
    if (filters.isFeatured !== undefined) {
        query.isFeatured = filters.isFeatured;
    }
    if (filters.isPublished !== undefined) {
        query.isPublished = filters.isPublished;
    }
    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }
    // Search filter (text search)
    if (filters.keyword) {
        query.$text = {
            $search: filters.keyword,
        };
    }
    // Sorting logic
    let sortCriteria = {};
    switch (sortOption.field) {
        case 'price_low_to_high':
            sortCriteria = { minPrice: 1 };
            break;
        case 'price_high_to_low':
            sortCriteria = { minPrice: -1 };
            break;
        case 'popular':
            sortCriteria = { soldCount: -1 };
            break;
        case 'top_rated':
            sortCriteria = { averageRating: -1, totalReviews: -1 };
            break;
        case 'latest':
        default:
            sortCriteria = { createdAt: -1 };
            break;
    }
    // Get total count
    const total = yield product_model_1.default.countDocuments(query);
    // Get products with pagination and sorting
    const products = yield product_model_1.default.find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean();
    // Transform response to include variant count, stock status, and material details
    const transformedData = yield Promise.all(products.map((product) => __awaiter(void 0, void 0, void 0, function* () {
        // Process each variant to find and attach material variant details
        const enrichedVariants = yield Promise.all(product.variants.map((variant) => __awaiter(void 0, void 0, void 0, function* () {
            // Check if variant has materials array
            if (!variant.materials || variant.materials.length === 0) {
                return variant;
            }
            // Enrich each material in the array
            const enrichedMaterials = yield Promise.all(variant.materials.map((materialRef) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    // Find the material document
                    const material = yield materials_model_1.default.findById(materialRef.materialId).lean();
                    if (!material) {
                        return materialRef;
                    }
                    // Find the specific material variant
                    const materialVariant = material.variants.find((v) => v._id.toString() === materialRef.materialVariantId.toString());
                    if (!materialVariant) {
                        return materialRef;
                    }
                    // Return enriched material
                    return {
                        materialId: materialRef.materialId,
                        materialVariantId: materialRef.materialVariantId,
                        quantity: materialRef.quantity,
                        unit: materialRef.unit,
                        // Material variant details
                        design: materialVariant.design,
                        color: materialVariant.color,
                        madeOf: materialVariant.madeOf,
                        purchasePrice: materialVariant.purchasePrice,
                        stockUnit: materialVariant.stockUnit,
                        // Material basic info
                        materialName: material.name,
                        materialCategory: material.category,
                    };
                }
                catch (error) {
                    return materialRef;
                }
            })));
            return Object.assign(Object.assign({}, variant), { materials: enrichedMaterials });
        })));
        return Object.assign(Object.assign({}, product), { variants: enrichedVariants, totalStock: product.variants.reduce((acc, v) => acc + v.stock, 0), variantCount: product.variants.length, inStock: product.variants.some((v) => v.stock > 0) });
    })));
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(skip / limit) + 1;
    return {
        data: transformedData,
        meta: {
            total,
            filteredTotal: total,
            skip,
            limit,
            totalPages,
            currentPage,
            hasMore: skip + limit < total,
        },
    };
});
/* Get Single Product */
// Helper function to enrich materials array
const enrichMaterialsArray = (materials) => __awaiter(void 0, void 0, void 0, function* () {
    if (!materials || materials.length === 0) {
        return materials;
    }
    return yield Promise.all(materials.map((materialRef) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const material = yield materials_model_1.default.findById(materialRef.materialId).lean();
            if (!material) {
                return materialRef;
            }
            const materialVariant = material.variants.find((v) => v._id.toString() === materialRef.materialVariantId.toString());
            if (!materialVariant) {
                return materialRef;
            }
            return {
                materialId: materialRef.materialId,
                materialVariantId: materialRef.materialVariantId,
                quantity: materialRef.quantity,
                unit: materialRef.unit,
                // Material variant details
                design: materialVariant.design,
                color: materialVariant.color,
                madeOf: materialVariant.madeOf,
                purchasePrice: materialVariant.purchasePrice,
                stockUnit: materialVariant.stockUnit,
                // Material basic info
                materialName: material.name,
                materialCategory: material.category,
            };
        }
        catch (error) {
            return materialRef;
        }
    })));
});
// Helper function to enrich variants with materials array
const enrichVariantsWithMaterials = (variants) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Promise.all(variants.map((variant) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if variant has materials array
        if (!variant.materials || variant.materials.length === 0) {
            return variant;
        }
        const enrichedMaterials = yield enrichMaterialsArray(variant.materials);
        return Object.assign(Object.assign({}, variant), { materials: enrichedMaterials });
    })));
});
const getSingleProductById = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findById(productId)
        .populate({
        path: "reviews",
        populate: {
            path: "user",
            select: "name profileImage",
        },
    });
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    // Increment click count
    yield product_model_1.default.findByIdAndUpdate(productId, {
        $inc: { totalClicks: 1 },
    });
    const productObj = product.toObject();
    // Enrich variants with material details
    const enrichedVariants = yield enrichVariantsWithMaterials(productObj.variants);
    return Object.assign(Object.assign({}, productObj), { variants: enrichedVariants, totalStock: productObj.variants.reduce((acc, v) => acc + v.stock, 0), inStock: productObj.variants.some((v) => v.stock > 0) });
});
const getSingleProductBySlug = (slug) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findOne({ slug })
        .populate({
        path: "reviews",
        populate: {
            path: "user",
            select: "name profileImage",
        },
    });
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    // Increment click count
    yield product_model_1.default.findOneAndUpdate({ slug }, { $inc: { totalClicks: 1 } });
    const productObj = product.toObject();
    // Enrich variants with material details
    const enrichedVariants = yield enrichVariantsWithMaterials(productObj.variants);
    return Object.assign(Object.assign({}, productObj), { variants: enrichedVariants, totalStock: productObj.variants.reduce((acc, v) => acc + v.stock, 0), inStock: productObj.variants.some((v) => v.stock > 0) });
});
/* Update Product */
const updateProduct = (productId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findById(productId);
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    // Process variants update
    let variants = product.variants;
    if (payload.variants) {
        variants = typeof payload.variants === 'string'
            ? JSON.parse(payload.variants)
            : payload.variants;
        // Process each variant
        variants = yield Promise.all(variants.map((variant) => __awaiter(void 0, void 0, void 0, function* () {
            let variantImageUrls = variant.images || [];
            // Handle removal of variant images
            if (variant.imagesToRemove && variant.imagesToRemove.length > 0) {
                yield Promise.all(variant.imagesToRemove.map((url) => __awaiter(void 0, void 0, void 0, function* () {
                    var _a;
                    const publicId = (_a = url.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
                    if (publicId) {
                        yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
                    }
                })));
                variantImageUrls = variantImageUrls.filter((url) => !variant.imagesToRemove.includes(url));
            }
            return Object.assign(Object.assign({}, variant), { images: variantImageUrls, stock: variant.stock || 0, materials: variant.materials || [], packageContents: variant.packageContents || [] });
        })));
    }
    // Upload new variant images
    if (files && files.length > 0) {
        let fileIndex = 0;
        for (let i = 0; i < variants.length && fileIndex < files.length; i++) {
            const variant = variants[i];
            // Upload all remaining files to the last variant if no variant-specific count
            const remainingFiles = files.length - fileIndex;
            const variantCount = i === variants.length - 1 ? remainingFiles : 1;
            for (let j = 0; j < variantCount && fileIndex < files.length; j++) {
                const file = files[fileIndex];
                if (file) {
                    const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`product-${Date.now()}-${i}-${j}`, file.path);
                    if (!variant.images)
                        variant.images = [];
                    variant.images.push(secure_url);
                    fileIndex++;
                }
            }
        }
    }
    // Recalculate price range
    const { minPrice, maxPrice, minDiscountedPrice } = calculatePriceRange(variants);
    const updatedProduct = yield product_model_1.default.findByIdAndUpdate(productId, Object.assign(Object.assign({}, payload), { variants,
        minPrice,
        maxPrice,
        minDiscountedPrice }), { new: true });
    return updatedProduct;
});
/* Delete Product */
const deleteProduct = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const product = yield product_model_1.default.findById(productId);
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    // Collect all images from all variants
    const allImages = [];
    if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
            if (variant.images && variant.images.length > 0) {
                allImages.push(...variant.images);
            }
        }
    }
    // Delete all images from Cloudinary
    if (allImages.length > 0) {
        yield Promise.all(allImages.map((url) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const publicId = (_a = url.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId) {
                yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
            }
        })));
    }
    // Delete all reviews
    if ((_a = product.reviews) === null || _a === void 0 ? void 0 : _a.length) {
        yield product_model_1.Review.deleteMany({ _id: { $in: product.reviews } });
    }
    yield product_model_1.default.findByIdAndDelete(productId);
    return true;
});
/* Add Review to Product */
const addReview = (productId, userId, rating, comment, images) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user has purchased the product (optional)
    // You can add order check here
    const review = yield product_model_1.Review.create({
        user: userId,
        rating,
        comment,
        images: images || [],
    });
    const product = yield product_model_1.default.findByIdAndUpdate(productId, {
        $push: { reviews: review._id },
        $inc: { totalReviews: 1 },
    }, { new: true });
    // Update average rating
    const allReviews = yield product_model_1.Review.find({ _id: { $in: product === null || product === void 0 ? void 0 : product.reviews } });
    const averageRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
    yield product_model_1.default.findByIdAndUpdate(productId, {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    });
    return review;
});
/* Get Product Reviews */
const getProductReviews = (productId_1, ...args_1) => __awaiter(void 0, [productId_1, ...args_1], void 0, function* (productId, skip = 0, limit = 10) {
    const product = yield product_model_1.default.findById(productId).select('reviews');
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    const reviews = yield product_model_1.Review.find({ _id: { $in: product.reviews } })
        .populate('user', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = yield product_model_1.Review.countDocuments({ _id: { $in: product.reviews } });
    return {
        data: reviews,
        total,
        pages: Math.ceil(total / limit),
    };
});
exports.ProductServices = {
    addProduct,
    getAllProducts,
    getSingleProductById,
    getSingleProductBySlug,
    updateProduct,
    deleteProduct,
    addReview,
    getProductReviews,
};
