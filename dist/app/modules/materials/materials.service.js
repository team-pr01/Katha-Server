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
exports.MaterialServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const materials_model_1 = __importDefault(require("./materials.model"));
const product_model_1 = __importDefault(require("../product/product.model"));
// Add Material
const addMaterial = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if material already exists
    const existingMaterial = yield materials_model_1.default.findOne({
        name: { $regex: new RegExp(`^${payload.name}$`, "i") },
    });
    if (existingMaterial) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Material already exists");
    }
    // Validate variants
    if (!payload.variants || payload.variants.length === 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Material must have at least one variant");
    }
    const material = yield materials_model_1.default.create(payload);
    return material;
});
// Get All Materials with Filters
const getAllMaterials = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    // Apply filters
    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }
    if (filters.category) {
        query.category = { $regex: new RegExp(`^${filters.category}$`, "i") };
    }
    if (filters.subCategory) {
        query.subCategory = { $regex: new RegExp(`^${filters.subCategory}$`, "i") };
    }
    if (filters.madeOf) {
        query['variants.madeOf'] = { $regex: new RegExp(`^${filters.madeOf}$`, "i") };
    }
    if (filters.search) {
        query.$text = {
            $search: filters.search,
        };
    }
    // Get total count
    const total = yield materials_model_1.default.countDocuments(query);
    // Get materials with pagination
    const materials = yield materials_model_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    // Get product counts for each material
    const materialsWithProductCounts = yield Promise.all(materials.map((material) => __awaiter(void 0, void 0, void 0, function* () {
        // Count products that use this material
        const productCount = yield product_model_1.default.countDocuments({
            'variants.materials.materialId': material._id,
            isActive: true,
        });
        // Count products for each variant
        const variantCounts = yield Promise.all(material.variants.map((variant) => __awaiter(void 0, void 0, void 0, function* () {
            const count = yield product_model_1.default.countDocuments({
                'variants.materials': {
                    $elemMatch: {
                        materialId: material._id,
                        materialVariantId: variant._id,
                    }
                },
                isActive: true,
            });
            return Object.assign(Object.assign({}, variant), { productCount: count });
        })));
        return Object.assign(Object.assign({}, material), { totalVariants: material.variants.length, totalStock: material.variants.reduce((acc, v) => acc + v.stock, 0), productCount, variants: variantCounts });
    })));
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(skip / limit) + 1;
    return {
        data: materialsWithProductCounts,
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
// Get Single Material by ID
const getSingleMaterial = (materialId) => __awaiter(void 0, void 0, void 0, function* () {
    const material = yield materials_model_1.default.findById(materialId).lean();
    if (!material) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Material not found");
    }
    return Object.assign(Object.assign({}, material), { totalVariants: material.variants.length, totalStock: material.variants.reduce((acc, v) => acc + v.stock, 0) });
});
// Get Material by Name
const getMaterialByName = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const material = yield materials_model_1.default.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        isActive: true,
    }).lean();
    if (!material) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Material not found");
    }
    return Object.assign(Object.assign({}, material), { totalVariants: material.variants.length, totalStock: material.variants.reduce((acc, v) => acc + v.stock, 0) });
});
// Update Material
const updateMaterial = (materialId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const material = yield materials_model_1.default.findById(materialId);
    if (!material) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Material not found");
    }
    // Validate variants if provided
    if (payload.variants && payload.variants.length === 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Material must have at least one variant");
    }
    const updatedMaterial = yield materials_model_1.default.findByIdAndUpdate(materialId, payload, { new: true });
    return updatedMaterial;
});
// Delete Material
const deleteMaterial = (materialId) => __awaiter(void 0, void 0, void 0, function* () {
    const material = yield materials_model_1.default.findById(materialId);
    if (!material) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Material not found");
    }
    // Check if material is being used by any product (optional)
    // You can add product check here if needed
    yield materials_model_1.default.findByIdAndDelete(materialId);
    return true;
});
// Add Variant to Material
const addVariant = (materialId, variantData) => __awaiter(void 0, void 0, void 0, function* () {
    const material = yield materials_model_1.default.findById(materialId);
    if (!material) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Material not found");
    }
    // Check if variant with same design and color exists
    const variantExists = material.variants.some((v) => v.design.toLowerCase() === variantData.design.toLowerCase() &&
        v.color.toLowerCase() === variantData.color.toLowerCase());
    if (variantExists) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Variant with this design and color already exists");
    }
    material.variants.push(variantData);
    yield material.save();
    return material;
});
// Update Variant
const updateVariant = (materialId, variantIndex, variantData) => __awaiter(void 0, void 0, void 0, function* () {
    const material = yield materials_model_1.default.findById(materialId);
    if (!material) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Material not found");
    }
    if (variantIndex < 0 || variantIndex >= material.variants.length) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Variant not found");
    }
    // Update the specific variant
    material.variants[variantIndex] = Object.assign(Object.assign({}, material.variants[variantIndex]), variantData);
    yield material.save();
    return material;
});
// Remove Variant
const removeVariant = (materialId, variantIndex) => __awaiter(void 0, void 0, void 0, function* () {
    const material = yield materials_model_1.default.findById(materialId);
    if (!material) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Material not found");
    }
    if (variantIndex < 0 || variantIndex >= material.variants.length) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Variant not found");
    }
    // Remove the variant
    material.variants.splice(variantIndex, 1);
    if (material.variants.length === 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot remove last variant. Material must have at least one variant");
    }
    yield material.save();
    return material;
});
exports.MaterialServices = {
    addMaterial,
    getAllMaterials,
    getSingleMaterial,
    getMaterialByName,
    updateMaterial,
    deleteMaterial,
    addVariant,
    updateVariant,
    removeVariant,
};
