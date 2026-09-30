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
exports.MaterialCategoryServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const materialCategory_model_1 = __importDefault(require("./materialCategory.model"));
// Add Material Category
const addMaterialCategory = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const name = String(payload.name || "").trim();
    if (!name) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Name is required");
    }
    const existing = yield materialCategory_model_1.default.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existing) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Material category with this name already exists");
    }
    // Parse subCategories from string or array
    let subCategories = [];
    if (Array.isArray(payload.subCategories)) {
        subCategories = payload.subCategories.map((s) => String(s).trim());
    }
    else if (typeof payload.subCategories === "string") {
        try {
            const parsed = JSON.parse(payload.subCategories);
            subCategories = Array.isArray(parsed)
                ? parsed.map((s) => String(s).trim())
                : [String(parsed).trim()];
        }
        catch (_a) {
            subCategories = payload.subCategories
                .split(",")
                .map((s) => s.trim());
        }
    }
    subCategories = subCategories.filter(Boolean);
    const materialCategory = yield materialCategory_model_1.default.create({
        name,
        subCategories,
    });
    return materialCategory;
});
// Get All Material Categories (with search & pagination)
const getAllMaterialCategories = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: "i" } },
            { subCategories: { $regex: filters.search, $options: "i" } },
        ];
    }
    const total = yield materialCategory_model_1.default.countDocuments(query);
    const categories = yield materialCategory_model_1.default.find(query)
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
});
// Get Single Material Category
const getSingleMaterialCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield materialCategory_model_1.default.findById(id).lean();
    if (!category) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Material category not found");
    }
    return category;
});
// Update Material Category
const updateMaterialCategory = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield materialCategory_model_1.default.findById(id);
    if (!category) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Material category not found");
    }
    const updateData = {};
    if (payload.name !== undefined) {
        const name = String(payload.name).trim();
        if (!name) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Name cannot be empty");
        }
        const existing = yield materialCategory_model_1.default.findOne({
            _id: { $ne: id },
            name: { $regex: new RegExp(`^${name}$`, "i") },
        });
        if (existing) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "Material category with this name already exists");
        }
        updateData.name = name;
    }
    if (payload.subCategories !== undefined) {
        let subCategories = [];
        if (Array.isArray(payload.subCategories)) {
            subCategories = payload.subCategories.map((s) => String(s).trim());
        }
        else if (typeof payload.subCategories === "string") {
            try {
                const parsed = JSON.parse(payload.subCategories);
                subCategories = Array.isArray(parsed)
                    ? parsed.map((s) => String(s).trim())
                    : [String(parsed).trim()];
            }
            catch (_a) {
                subCategories = payload.subCategories
                    .split(",")
                    .map((s) => s.trim());
            }
        }
        updateData.subCategories = subCategories.filter(Boolean);
    }
    const updated = yield materialCategory_model_1.default.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });
    return updated;
});
// Delete Material Category
const deleteMaterialCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield materialCategory_model_1.default.findById(id);
    if (!category) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Material category not found");
    }
    yield materialCategory_model_1.default.findByIdAndDelete(id);
    return true;
});
exports.MaterialCategoryServices = {
    addMaterialCategory,
    getAllMaterialCategories,
    getSingleMaterialCategory,
    updateMaterialCategory,
    deleteMaterialCategory,
};
