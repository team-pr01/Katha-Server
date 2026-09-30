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
exports.HeroServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const hero_model_1 = __importDefault(require("./hero.model"));
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const deleteImageFromCloudinary_1 = require("../../utils/deleteImageFromCloudinary");
const getPublicIdFromUrl = (url) => {
    var _a;
    if (!url)
        return null;
    const publicId = (_a = url.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
    return publicId || null;
};
// Add Hero
const addHero = (payload, file) => __awaiter(void 0, void 0, void 0, function* () {
    // Upload image
    let imageUrl = payload.image || "";
    if (file) {
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`hero-${Date.now()}`, file.path);
        imageUrl = secure_url;
    }
    if (!imageUrl) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Hero image is required");
    }
    const hero = yield hero_model_1.default.create({
        alt: payload.alt,
        link: payload.link,
        image: imageUrl,
    });
    return hero;
});
// Get All Heroes (Admin - includes inactive)
const getAllHeroesAdmin = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
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
    const total = yield hero_model_1.default.countDocuments(query);
    const heroes = yield hero_model_1.default.find(query)
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
});
// Get Active Heroes (Public - for frontend carousel)
const getActiveHeroes = () => __awaiter(void 0, void 0, void 0, function* () {
    const heroes = yield hero_model_1.default.find({ isActive: true })
        .sort({ order: 1 })
        .lean();
    return heroes;
});
// Get Single Hero
const getSingleHero = (heroId) => __awaiter(void 0, void 0, void 0, function* () {
    const hero = yield hero_model_1.default.findById(heroId).lean();
    if (!hero) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Hero not found");
    }
    return hero;
});
// Update Hero
const updateHero = (heroId, payload, file) => __awaiter(void 0, void 0, void 0, function* () {
    const hero = yield hero_model_1.default.findById(heroId);
    if (!hero) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Hero not found");
    }
    const updateData = {};
    // Basic fields
    if (payload.alt !== undefined)
        updateData.alt = payload.alt;
    if (payload.link !== undefined)
        updateData.link = payload.link;
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
                    yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
                }
                catch (err) {
                    // Log but don't fail
                    console.error("Failed to delete old hero image:", err);
                }
            }
        }
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`hero-${Date.now()}`, file.path);
        updateData.image = secure_url;
    }
    else if (payload.image) {
        updateData.image = payload.image;
    }
    const updatedHero = yield hero_model_1.default.findByIdAndUpdate(heroId, updateData, {
        new: true,
        runValidators: true,
    });
    return updatedHero;
});
// Delete Hero
const deleteHero = (heroId) => __awaiter(void 0, void 0, void 0, function* () {
    const hero = yield hero_model_1.default.findById(heroId);
    if (!hero) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Hero not found");
    }
    // Delete image from Cloudinary
    if (hero.image) {
        const publicId = getPublicIdFromUrl(hero.image);
        if (publicId) {
            try {
                yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
            }
            catch (err) {
                console.error("Failed to delete hero image:", err);
            }
        }
    }
    yield hero_model_1.default.findByIdAndDelete(heroId);
    return true;
});
// Reorder Heroes
const reorderHeroes = (orders) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all(orders.map(({ id, order }) => hero_model_1.default.findByIdAndUpdate(id, { order })));
    return true;
});
exports.HeroServices = {
    addHero,
    getAllHeroesAdmin,
    getActiveHeroes,
    getSingleHero,
    updateHero,
    deleteHero,
    reorderHeroes,
};
