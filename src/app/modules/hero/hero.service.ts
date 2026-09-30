/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Hero from "./hero.model";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import AppError from "../../errors/AppError";
import { deleteImageFromCloudinary } from "../../utils/deleteImageFromCloudinary";

const getPublicIdFromUrl = (url: string): string | null => {
    if (!url) return null;
    const publicId = url.split("/").pop()?.split(".")[0];
    return publicId || null;
};

// Add Hero
const addHero = async (payload: any, file?: Express.Multer.File) => {
    // Upload image
    let imageUrl = payload.image || "";
    if (file) {
        const { secure_url } = await sendImageToCloudinary(
            `hero-${Date.now()}`,
            file.path
        );
        imageUrl = secure_url;
    }

    if (!imageUrl) {
        throw new AppError(httpStatus.BAD_REQUEST, "Hero image is required");
    }

    const hero = await Hero.create({
        alt: payload.alt,
        link: payload.link,
        image: imageUrl,
    });

    return hero;
};

// Get All Heroes (Admin - includes inactive)
const getAllHeroesAdmin = async (filters: any = {}, skip = 0, limit = 10) => {
    const query: any = {};

    // if (filters.search) {
    //     query.$or = [
    //         { title: { $regex: filters.search, $options: "i" } },
    //         { highlightedTitle: { $regex: filters.search, $options: "i" } },
    //     ];
    // }

    if (filters.isActive !== undefined) {
        query.isActive =
            filters.isActive === "true" || filters.isActive === true;
    }

    const total = await Hero.countDocuments(query);

    const heroes = await Hero.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        data: heroes,
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

// Get Active Heroes (Public - for frontend carousel)
const getActiveHeroes = async () => {
    const heroes = await Hero.find({ isActive: true })
        .sort({ order: 1 })
        .lean();
    return heroes;
};

// Get Single Hero
const getSingleHero = async (heroId: string) => {
    const hero = await Hero.findById(heroId).lean();
    if (!hero) {
        throw new AppError(httpStatus.NOT_FOUND, "Hero not found");
    }
    return hero;
};

// Update Hero
const updateHero = async (
    heroId: string,
    payload: any,
    file?: Express.Multer.File
) => {
    const hero = await Hero.findById(heroId);
    if (!hero) {
        throw new AppError(httpStatus.NOT_FOUND, "Hero not found");
    }

    const updateData: any = {};

    // Basic fields
    if (payload.alt !== undefined) updateData.alt = payload.alt;
    if (payload.link !== undefined) updateData.link = payload.link;
    if (payload.isActive !== undefined) {
        updateData.isActive =
            payload.isActive === "true" || payload.isActive === true;
    }

    // Image update
    if (file) {
        // Delete old image from Cloudinary
        if (hero.image) {
            const publicId = getPublicIdFromUrl(hero.image);
            if (publicId) {
                try {
                    await deleteImageFromCloudinary(publicId);
                } catch (err) {
                    // Log but don't fail
                    console.error("Failed to delete old hero image:", err);
                }
            }
        }

        const { secure_url } = await sendImageToCloudinary(
            `hero-${Date.now()}`,
            file.path
        );
        updateData.image = secure_url;
    } else if (payload.image) {
        updateData.image = payload.image;
    }

    const updatedHero = await Hero.findByIdAndUpdate(heroId, updateData, {
        new: true,
        runValidators: true,
    });

    return updatedHero;
};

// Delete Hero
const deleteHero = async (heroId: string) => {
    const hero = await Hero.findById(heroId);
    if (!hero) {
        throw new AppError(httpStatus.NOT_FOUND, "Hero not found");
    }

    // Delete image from Cloudinary
    if (hero.image) {
        const publicId = getPublicIdFromUrl(hero.image);
        if (publicId) {
            try {
                await deleteImageFromCloudinary(publicId);
            } catch (err) {
                console.error("Failed to delete hero image:", err);
            }
        }
    }

    await Hero.findByIdAndDelete(heroId);
    return true;
};

// Reorder Heroes
const reorderHeroes = async (orders: { id: string; order: number }[]) => {
    await Promise.all(
        orders.map(({ id, order }) =>
            Hero.findByIdAndUpdate(id, { order })
        )
    );
    return true;
};

export const HeroServices = {
    addHero,
    getAllHeroesAdmin,
    getActiveHeroes,
    getSingleHero,
    updateHero,
    deleteHero,
    reorderHeroes,
};