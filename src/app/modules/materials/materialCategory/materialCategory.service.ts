/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import MaterialCategory from "./materialCategory.model";

// Add Material Category
const addMaterialCategory = async (payload: any) => {
    const name = String(payload.name || "").trim();
    if (!name) {
        throw new AppError(httpStatus.BAD_REQUEST, "Name is required");
    }

    const existing = await MaterialCategory.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existing) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Material category with this name already exists"
        );
    }

    // Parse subCategories from string or array
    let subCategories: string[] = [];
    if (Array.isArray(payload.subCategories)) {
        subCategories = payload.subCategories.map((s: any) =>
            String(s).trim()
        );
    } else if (typeof payload.subCategories === "string") {
        try {
            const parsed = JSON.parse(payload.subCategories);
            subCategories = Array.isArray(parsed)
                ? parsed.map((s: any) => String(s).trim())
                : [String(parsed).trim()];
        } catch {
            subCategories = payload.subCategories
                .split(",")
                .map((s: string) => s.trim());
        }
    }
    subCategories = subCategories.filter(Boolean);

    const materialCategory = await MaterialCategory.create({
        name,
        subCategories,
    });

    return materialCategory;
};

// Get All Material Categories (with search & pagination)
const getAllMaterialCategories = async (
    filters: any = {},
    skip = 0,
    limit = 10
) => {
    const query: any = {};

    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: "i" } },
            { subCategories: { $regex: filters.search, $options: "i" } },
        ];
    }

    const total = await MaterialCategory.countDocuments(query);

    const categories = await MaterialCategory.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        data: categories,
        meta: {
            total,
            filteredTotal: total,
            skip,
            limit,
            totalPages: Math.ceil(total / limit),
            currentPage: Math.floor(skip / limit) + 1,
            hasMore: skip + limit < total,
        },
    };
};

// Get Single Material Category
const getSingleMaterialCategory = async (id: string) => {
    const category = await MaterialCategory.findById(id).lean();
    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, "Material category not found");
    }
    return category;
};

// Update Material Category
const updateMaterialCategory = async (id: string, payload: any) => {
    const category = await MaterialCategory.findById(id);
    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, "Material category not found");
    }

    const updateData: any = {};

    if (payload.name !== undefined) {
        const name = String(payload.name).trim();
        if (!name) {
            throw new AppError(httpStatus.BAD_REQUEST, "Name cannot be empty");
        }

        const existing = await MaterialCategory.findOne({
            _id: { $ne: id },
            name: { $regex: new RegExp(`^${name}$`, "i") },
        });
        if (existing) {
            throw new AppError(
                httpStatus.CONFLICT,
                "Material category with this name already exists"
            );
        }
        updateData.name = name;
    }

    if (payload.subCategories !== undefined) {
        let subCategories: string[] = [];
        if (Array.isArray(payload.subCategories)) {
            subCategories = payload.subCategories.map((s: any) =>
                String(s).trim()
            );
        } else if (typeof payload.subCategories === "string") {
            try {
                const parsed = JSON.parse(payload.subCategories);
                subCategories = Array.isArray(parsed)
                    ? parsed.map((s: any) => String(s).trim())
                    : [String(parsed).trim()];
            } catch {
                subCategories = payload.subCategories
                    .split(",")
                    .map((s: string) => s.trim());
            }
        }
        updateData.subCategories = subCategories.filter(Boolean);
    }

    const updated = await MaterialCategory.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });

    return updated;
};

// Delete Material Category
const deleteMaterialCategory = async (id: string) => {
    const category = await MaterialCategory.findById(id);
    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, "Material category not found");
    }

    await MaterialCategory.findByIdAndDelete(id);
    return true;
};

export const MaterialCategoryServices = {
    addMaterialCategory,
    getAllMaterialCategories,
    getSingleMaterialCategory,
    updateMaterialCategory,
    deleteMaterialCategory,
};