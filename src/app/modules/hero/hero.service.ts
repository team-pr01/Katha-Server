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

    // Parse buttons
    let buttons = payload.buttons || [];
    if (typeof buttons === "string") {
        try {
            buttons = JSON.parse(buttons);
        } catch {
            buttons = [];
        }
    }

    // Parse colors
    let colors = payload.colors || {};
    if (typeof colors === "string") {
        try {
            colors = JSON.parse(colors);
        } catch {
            colors = {};
        }
    }

    // Auto-assign order if not provided
    let order = Number(payload.order);
    if (isNaN(order)) {
        const lastHero = await Hero.findOne().sort({ order: -1 }).lean();
        order = lastHero ? lastHero.order + 1 : 0;
    }

    const hero = await Hero.create({
        title: payload.title,
        highlightedTitle: payload.highlightedTitle || "",
        description: payload.description,
        image: imageUrl,
        buttons,
        colors: {
            titleColor: colors.titleColor || "#FFFFFF",
            subtitleColor: colors.subtitleColor || "#F59E0B",
            descriptionColor: colors.descriptionColor || "#E5E7EB",
            buttonTextColor: colors.buttonTextColor || "#1F2937",
        },
        overlayOpacity:
            payload.overlayOpacity !== undefined
                ? Number(payload.overlayOpacity)
                : 0.5,
        textAlignment: payload.textAlignment || "left",
        isActive:
            payload.isActive !== undefined
                ? payload.isActive === "true" || payload.isActive === true
                : true,
        order,
    });

    return hero;
};

// Get All Heroes (Admin - includes inactive)
const getAllHeroesAdmin = async (filters: any = {}, skip = 0, limit = 10) => {
    const query: any = {};

    if (filters.search) {
        query.$or = [
            { title: { $regex: filters.search, $options: "i" } },
            { highlightedTitle: { $regex: filters.search, $options: "i" } },
        ];
    }

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
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.highlightedTitle !== undefined)
        updateData.highlightedTitle = payload.highlightedTitle;
    if (payload.description !== undefined)
        updateData.description = payload.description;
    if (payload.textAlignment !== undefined)
        updateData.textAlignment = payload.textAlignment;

    if (payload.overlayOpacity !== undefined) {
        updateData.overlayOpacity = Number(payload.overlayOpacity);
    }

    if (payload.isActive !== undefined) {
        updateData.isActive =
            payload.isActive === "true" || payload.isActive === true;
    }

    if (payload.order !== undefined && !isNaN(Number(payload.order))) {
        updateData.order = Number(payload.order);
    }

    // Buttons
    if (payload.buttons !== undefined) {
        let buttons = payload.buttons;
        if (typeof buttons === "string") {
            try {
                buttons = JSON.parse(buttons);
            } catch {
                buttons = [];
            }
        }
        updateData.buttons = buttons;
    }

    // Colors
    if (payload.colors !== undefined) {
        let colors = payload.colors;
        if (typeof colors === "string") {
            try {
                colors = JSON.parse(colors);
            } catch {
                colors = {};
            }
        }
        updateData.colors = colors;
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