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
exports.ProductVariantServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const product_model_1 = __importDefault(require("../product.model"));
const sendImageToCloudinary_1 = require("../../../utils/sendImageToCloudinary");
const deleteImageFromCloudinary_1 = require("../../../utils/deleteImageFromCloudinary");
const parseArrayField = (value) => {
    if (value === null || value === undefined)
        return [];
    // Already an array
    if (Array.isArray(value)) {
        return value.filter((item) => item !== null && item !== undefined && item !== "");
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "")
            return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.filter((item) => item !== null && item !== undefined && item !== "");
            }
            return [parsed];
        }
        catch (_a) {
            if (trimmed.includes(",")) {
                return trimmed
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s !== "");
            }
            return [trimmed];
        }
    }
    return [value];
};
const addVariant = (productId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findById(productId);
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    // Upload variant images
    let imageUrls = [];
    if (files === null || files === void 0 ? void 0 : files.length) {
        imageUrls = yield Promise.all(files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`product-${productId}-variant-${Date.now()}-${index}`, file.path);
            return secure_url;
        })));
    }
    if (!imageUrls.length) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "At least one variant image is required");
    }
    // Parse materials
    let materials = payload.materials || [];
    if (typeof materials === "string") {
        try {
            materials = JSON.parse(materials);
        }
        catch (_a) {
            materials = [];
        }
    }
    materials = materials.filter((m) => m === null || m === void 0 ? void 0 : m.materialId);
    // Parse packageContents
    const packageContents = parseArrayField(payload.packageContents);
    // Build variant
    const newVariant = {
        name: payload.name,
        description: payload.description,
        design: payload.design,
        size: payload.size,
        color: payload.color,
        packSize: payload.packSize || "Single",
        dimensions: JSON.parse(payload.dimensions), // or however sent
        weight: payload.weight,
        packageContents,
        images: imageUrls,
        materials,
        basePrice: Number(payload.basePrice),
        discountedPrice: payload.discountedPrice ? Number(payload.discountedPrice) : undefined,
        bulkPrice: payload.bulkPrice ? Number(payload.bulkPrice) : undefined,
        stock: Number(payload.stock) || 0,
        makingCost: Number(payload.makingCost) || 0,
        processingTime: payload.processingTime,
    };
    // Push variant and recalculate price range
    product.variants.push(newVariant);
    const prices = product.variants.map((v) => v.basePrice);
    const discountedPrices = product.variants
        .map((v) => v.discountedPrice)
        .filter((p) => p !== undefined && p !== null);
    product.minPrice = Math.min(...prices);
    product.maxPrice = Math.max(...prices);
    product.minDiscountedPrice = discountedPrices.length
        ? Math.min(...discountedPrices)
        : undefined;
    // Auto-publish once first variant is added
    if (!product.isPublished && product.variants.length > 0) {
        product.isPublished = true;
    }
    yield product.save();
    return product;
});
const getAllVariantsOfAProduct = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findById(productId)
        .select("name slug variants")
        .lean();
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    const variants = product.variants || [];
    return {
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        totalVariants: variants.length,
        variants,
    };
});
const getSingleVariantOfAProduct = (productId, variantId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const product = yield product_model_1.default.findById(productId)
        .select("name slug variants")
        .lean();
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    const variant = (_a = product.variants) === null || _a === void 0 ? void 0 : _a.find((v) => v._id.toString() === variantId);
    if (!variant) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Variant not found");
    }
    return {
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        variant,
    };
});
const updateVariant = (productId, variantId, payload, files, imagesToRemove) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findById(productId);
    if (!product)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    const variant = product.variants.find((v) => v._id.toString() === variantId);
    if (!variant)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Variant not found");
    // Remove old images from Cloudinary
    if (imagesToRemove === null || imagesToRemove === void 0 ? void 0 : imagesToRemove.length) {
        yield Promise.all(imagesToRemove.map((url) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const publicId = (_a = url.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId)
                yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
        })));
        variant.images = variant.images.filter((img) => !imagesToRemove.includes(img));
    }
    // Upload new images
    if (files === null || files === void 0 ? void 0 : files.length) {
        const newUrls = yield Promise.all(files.map((file, i) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`variant-${variantId}-${Date.now()}-${i}`, file.path);
            return secure_url;
        })));
        variant.images.push(...newUrls);
    }
    // Update fields
    const allowedFields = [
        "name", "description", "design", "size", "color", "packSize",
        "weight", "basePrice", "discountedPrice", "bulkPrice", "stock"
    ];
    for (const field of allowedFields) {
        if (payload[field] !== undefined) {
            variant[field] = payload[field];
        }
    }
    if (payload.dimensions) {
        variant.dimensions = typeof payload.dimensions === "string"
            ? JSON.parse(payload.dimensions)
            : payload.dimensions;
    }
    if (payload.materials) {
        const materials = typeof payload.materials === "string"
            ? JSON.parse(payload.materials)
            : payload.materials;
        variant.materials = materials.filter((m) => m === null || m === void 0 ? void 0 : m.materialId);
    }
    // Recalculate price range
    const prices = product.variants.map((v) => v.basePrice);
    const discountedPrices = product.variants
        .map((v) => v.discountedPrice)
        .filter((p) => p !== undefined && p !== null);
    product.minPrice = Math.min(...prices);
    product.maxPrice = Math.max(...prices);
    product.minDiscountedPrice = discountedPrices.length
        ? Math.min(...discountedPrices)
        : undefined;
    yield product.save();
    return product;
});
const deleteVariant = (productId, variantId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const product = yield product_model_1.default.findById(productId);
    if (!product)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    const variant = product.variants.find((v) => v._id.toString() === variantId);
    if (!variant)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Variant not found");
    // Delete variant images from Cloudinary
    if ((_a = variant.images) === null || _a === void 0 ? void 0 : _a.length) {
        yield Promise.all(variant.images.map((url) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const publicId = (_a = url.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId)
                yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
        })));
    }
    // Remove variant
    product.variants = product.variants.filter((v) => v._id.toString() !== variantId);
    // Recalculate price range or reset
    if (product.variants.length > 0) {
        const prices = product.variants.map((v) => v.basePrice);
        const discountedPrices = product.variants
            .map((v) => v.discountedPrice)
            .filter((p) => p !== undefined && p !== null);
        product.minPrice = Math.min(...prices);
        product.maxPrice = Math.max(...prices);
        product.minDiscountedPrice = discountedPrices.length
            ? Math.min(...discountedPrices)
            : undefined;
    }
    else {
        // No variants left → unpublish
        product.minPrice = 0;
        product.maxPrice = 0;
        product.minDiscountedPrice = undefined;
        product.isPublished = false;
    }
    yield product.save();
    return product;
});
exports.ProductVariantServices = {
    addVariant,
    getAllVariantsOfAProduct,
    getSingleVariantOfAProduct,
    updateVariant,
    deleteVariant
};
