/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TMaterialFilters, TMaterials, TMaterialVariant } from "./materials.type";
import Material from "./materials.model";

// Add Material
const addMaterial = async (payload: TMaterials) => {
    // Check if material already exists
    const existingMaterial = await Material.findOne({
        name: { $regex: new RegExp(`^${payload.name}$`, "i") },
    });

    if (existingMaterial) {
        throw new AppError(httpStatus.CONFLICT, "Material already exists");
    }

    // Validate variants
    if (!payload.variants || payload.variants.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Material must have at least one variant");
    }

    const material = await Material.create(payload);
    return material;
};

// Get All Materials with Filters
const getAllMaterials = async (
    filters: TMaterialFilters = {},
    skip = 0,
    limit = 10
) => {
    const query: any = {};

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
    const total = await Material.countDocuments(query);

    // Get materials with pagination
    const materials = await Material.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(skip / limit) + 1;

    // Transform response to include variant count and total stock
    const transformedData = materials.map((material: any) => ({
        ...material,
        totalVariants: material.variants.length,
        totalStock: material.variants.reduce((acc: number, v: any) => acc + v.stock, 0),
    }));

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
};

// Get Single Material by ID
const getSingleMaterial = async (materialId: string) => {
    const material = await Material.findById(materialId).lean();

    if (!material) {
        throw new AppError(httpStatus.NOT_FOUND, "Material not found");
    }

    return {
        ...material,
        totalVariants: material.variants.length,
        totalStock: material.variants.reduce((acc: number, v: any) => acc + v.stock, 0),
    };
};

// Get Material by Name
const getMaterialByName = async (name: string) => {
    const material = await Material.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        isActive: true,
    }).lean();

    if (!material) {
        throw new AppError(httpStatus.NOT_FOUND, "Material not found");
    }

    return {
        ...material,
        totalVariants: material.variants.length,
        totalStock: material.variants.reduce((acc: number, v: any) => acc + v.stock, 0),
    };
};

// Update Material
const updateMaterial = async (
    materialId: string,
    payload: Partial<TMaterials>
) => {
    const material = await Material.findById(materialId);

    if (!material) {
        throw new AppError(httpStatus.NOT_FOUND, "Material not found");
    }

    // Validate variants if provided
    if (payload.variants && payload.variants.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Material must have at least one variant");
    }

    const updatedMaterial = await Material.findByIdAndUpdate(
        materialId,
        payload,
        { new: true }
    );

    return updatedMaterial;
};

// Delete Material
const deleteMaterial = async (materialId: string) => {
    const material = await Material.findById(materialId);

    if (!material) {
        throw new AppError(httpStatus.NOT_FOUND, "Material not found");
    }

    // Check if material is being used by any product (optional)
    // You can add product check here if needed

    await Material.findByIdAndDelete(materialId);

    return true;
};

// Add Variant to Material
const addVariant = async (
    materialId: string,
    variantData: TMaterialVariant
) => {
    const material = await Material.findById(materialId);

    if (!material) {
        throw new AppError(httpStatus.NOT_FOUND, "Material not found");
    }

    // Check if variant with same design and color exists
    const variantExists = material.variants.some(
        (v) =>
            v.design.toLowerCase() === variantData.design.toLowerCase() &&
            v.color.toLowerCase() === variantData.color.toLowerCase()
    );

    if (variantExists) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Variant with this design and color already exists"
        );
    }

    material.variants.push(variantData);
    await material.save();

    return material;
};

// Update Variant
const updateVariant = async (
    materialId: string,
    variantIndex: number,
    variantData: Partial<TMaterialVariant>
) => {
    const material = await Material.findById(materialId);

    if (!material) {
        throw new AppError(httpStatus.NOT_FOUND, "Material not found");
    }

    if (variantIndex < 0 || variantIndex >= material.variants.length) {
        throw new AppError(httpStatus.NOT_FOUND, "Variant not found");
    }

    // Update the specific variant
    material.variants[variantIndex] = {
        ...material.variants[variantIndex],
        ...variantData,
    };

    await material.save();

    return material;
};

// Remove Variant
const removeVariant = async (
    materialId: string,
    variantIndex: number
) => {
    const material = await Material.findById(materialId);

    if (!material) {
        throw new AppError(httpStatus.NOT_FOUND, "Material not found");
    }

    if (variantIndex < 0 || variantIndex >= material.variants.length) {
        throw new AppError(httpStatus.NOT_FOUND, "Variant not found");
    }

    // Remove the variant
    material.variants.splice(variantIndex, 1);

    if (material.variants.length === 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot remove last variant. Material must have at least one variant"
        );
    }

    await material.save();

    return material;
};

export const MaterialServices = {
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