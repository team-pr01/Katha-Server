/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Occasion from "./occasion.model";
import Product from "../product/product.model";
import { TOccasionFilters, TOccasion, TSubOccasion } from "./occasion.interface";
import AppError from "../../errors/AppError";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { deleteImageFromCloudinary } from "../../utils/deleteImageFromCloudinary";

// Add Occasion
const addOccasion = async (
    payload: Partial<TOccasion>,
    file: Express.Multer.File | undefined
) => {
    // Check if occasion already exists
    const existingOccasion = await Occasion.findOne({
        name: { $regex: new RegExp(`^${payload.name}$`, "i") },
    });

    if (existingOccasion) {
        throw new AppError(httpStatus.CONFLICT, "Occasion already exists");
    }

    // Upload image to Cloudinary
    let imageUrl = "";
    if (file) {
        const { secure_url } = await sendImageToCloudinary(
            `occasion-${Date.now()}`,
            file.path
        );
        imageUrl = secure_url;
    }

    // Process sub-occasions - Handle both array and JSON string
    let subOccasions: any[] = [];

    if (payload.subOccasions) {
        // If it's a string, parse it as JSON
        if (typeof payload.subOccasions === 'string') {
            try {
                subOccasions = JSON.parse(payload.subOccasions);
            } catch (error) {
                throw new AppError(httpStatus.BAD_REQUEST, "Invalid subOccasions format. Must be a valid JSON array");
            }
        }
        // If it's already an array, use it directly
        else if (Array.isArray(payload.subOccasions)) {
            subOccasions = payload.subOccasions;
        } else {
            throw new AppError(httpStatus.BAD_REQUEST, "subOccasions must be an array or JSON string");
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

    const occasion = await Occasion.create(occasionData);

    return occasion;
};

// Get All Occasions with Products Count
const getAllOccasions = async (
    filters: TOccasionFilters = {},
    skip = 0,
    limit = 10
) => {
    const query: any = {};

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
    const occasions = await Occasion.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Occasion.countDocuments(query);

    // Get product counts for each occasion
    const occasionsWithCounts = await Promise.all(
        occasions.map(async (occasion) => {
            // Count products for this occasion - using $in with occasionNames array
            const productCount = await Product.countDocuments({
                occasionNames: { $in: [occasion.name] },
                isActive: true,
            });

            // Get sub-occasion product counts
            const subOccasionCounts = await Promise.all(
                occasion.subOccasions.map(async (sub) => {
                    const count = await Product.countDocuments({
                        occasionNames: { $in: [occasion.name] },
                        subOccasionNames: { $in: [sub.name] },
                        isActive: true,
                    });
                    return {
                        ...sub,
                        productCount: count,
                    };
                })
            );

            return {
                ...occasion,
                productCount,
                subOccasions: subOccasionCounts,
            };
        })
    );

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
};

// Get Single Occasion with Products
const getSingleOccasion = async (occasionId: string) => {
    const occasion = await Occasion.findById(occasionId).lean();

    if (!occasion) {
        throw new AppError(httpStatus.NOT_FOUND, "Occasion not found");
    }

    // Get products for this occasion
    const products = await Product.find({
        occasion: occasion.name,
        isActive: true,
    })
        .select("name images minPrice maxPrice averageRating soldCount")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    // Get sub-occasion products
    const subOccasionProducts = await Promise.all(
        occasion.subOccasions.map(async (sub) => {
            const subProducts = await Product.find({
                occasion: occasion.name,
                subOccasion: sub.name,
                isActive: true,
            })
                .select("name images minPrice maxPrice averageRating soldCount")
                .limit(10)
                .lean();

            return {
                ...sub,
                products: subProducts,
                productCount: subProducts.length,
            };
        })
    );

    return {
        ...occasion,
        products,
        productCount: products.length,
        subOccasions: subOccasionProducts,
    };
};

// Update Occasion
const updateOccasion = async (
    occasionId: string,
    payload: Partial<TOccasion>,
    file: Express.Multer.File | undefined,
    imagesToRemove?: string[]
) => {
    const occasion = await Occasion.findById(occasionId);

    if (!occasion) {
        throw new AppError(httpStatus.NOT_FOUND, "Occasion not found");
    }

    // Handle image update
    let imageUrl = occasion.imageUrl;

    // Remove old image if requested
    if (imagesToRemove && imagesToRemove.length > 0) {
        const publicId = occasion.imageUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
            await deleteImageFromCloudinary(publicId);
        }
        imageUrl = "";
    }

    // Upload new image if provided
    if (file) {
        const { secure_url } = await sendImageToCloudinary(
            `occasion-${Date.now()}`,
            file.path
        );
        imageUrl = secure_url;
    }

    // Update sub-occasions if provided
    let subOccasions = occasion.subOccasions;
    if (payload.subOccasions) {
        subOccasions = payload.subOccasions.map((sub) => ({
            ...sub,
            _id: sub._id || undefined,
        }));
    }

    const updatedOccasion = await Occasion.findByIdAndUpdate(
        occasionId,
        {
            ...payload,
            imageUrl: imageUrl || payload.imageUrl,
            subOccasions,
        },
        { new: true }
    );

    return updatedOccasion;
};

// Delete Occasion
const deleteOccasion = async (occasionId: string) => {
    const occasion = await Occasion.findById(occasionId);

    if (!occasion) {
        throw new AppError(httpStatus.NOT_FOUND, "Occasion not found");
    }

    // Check if any products are using this occasion
    const productCount = await Product.countDocuments({
        occasion: occasion.name,
    });

    if (productCount > 0) {
        throw new AppError(
            httpStatus.CONFLICT,
            `Cannot delete occasion. ${productCount} products are associated with this occasion. Please reassign or delete the products first.`
        );
    }

    // Delete image from Cloudinary
    if (occasion.imageUrl) {
        const publicId = occasion.imageUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
            await deleteImageFromCloudinary(publicId);
        }
    }

    await Occasion.findByIdAndDelete(occasionId);

    return true;
};

// Add Sub-Occasion to an existing occasion
const addSubOccasion = async (
    occasionId: string,
    subOccasionData: Partial<TSubOccasion>,
) => {
    const occasion = await Occasion.findById(occasionId);

    if (!occasion) {
        throw new AppError(httpStatus.NOT_FOUND, "Occasion not found");
    }

    // Check if sub-occasion already exists
    const subExists = occasion.subOccasions.some(
        (sub) => sub.name.toLowerCase() === subOccasionData.name?.toLowerCase()
    );

    if (subExists) {
        throw new AppError(httpStatus.CONFLICT, "Sub-occasion already exists");
    }

    const newSubOccasion = {
        ...subOccasionData,
    };

    occasion.subOccasions.push(newSubOccasion as TSubOccasion);
    await occasion.save();

    return occasion;
};

// Remove Sub-Occasion
const removeSubOccasion = async (occasionId: string, subOccasionId: string) => {
    const occasion = await Occasion.findById(occasionId);

    if (!occasion) {
        throw new AppError(httpStatus.NOT_FOUND, "Occasion not found");
    }

    // Find the sub-occasion to get its image
    const subOccasion = occasion.subOccasions.find(
        (sub) => sub._id?.toString() === subOccasionId
    );

    if (!subOccasion) {
        throw new AppError(httpStatus.NOT_FOUND, "Sub-occasion not found");
    }

    // Remove sub-occasion from array
    occasion.subOccasions = occasion.subOccasions.filter(
        (sub) => sub._id?.toString() !== subOccasionId
    );

    await occasion.save();

    return occasion;
};

export const OccasionServices = {
    addOccasion,
    getAllOccasions,
    getSingleOccasion,
    updateOccasion,
    deleteOccasion,
    addSubOccasion,
    removeSubOccasion,
};