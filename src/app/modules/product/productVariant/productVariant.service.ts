/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import Product from "../product.model";
import { sendImageToCloudinary } from "../../../utils/sendImageToCloudinary";
import { deleteImageFromCloudinary } from "../../../utils/deleteImageFromCloudinary";


const parseArrayField = (value: any): any[] => {
    if (value === null || value === undefined) return [];

    // Already an array
    if (Array.isArray(value)) {
        return value.filter((item) => item !== null && item !== undefined && item !== "");
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (trimmed === "") return [];

        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.filter(
                    (item) => item !== null && item !== undefined && item !== ""
                );
            }
            return [parsed];
        } catch {
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

const addVariant = async (
    productId: string,
    payload: any,
    files: Express.Multer.File[]
) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Upload variant images
    let imageUrls: string[] = [];
    if (files?.length) {
        imageUrls = await Promise.all(
            files.map(async (file, index) => {
                const { secure_url } = await sendImageToCloudinary(
                    `product-${productId}-variant-${Date.now()}-${index}`,
                    file.path
                );
                return secure_url;
            })
        );
    }

    if (!imageUrls.length) {
        throw new AppError(httpStatus.BAD_REQUEST, "At least one variant image is required");
    }

    // Parse materials
    let materials = payload.materials || [];
    if (typeof materials === "string") {
        try { materials = JSON.parse(materials); } catch { materials = []; }
    }
    materials = materials.filter((m: any) => m?.materialId);

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
    product.variants.push(newVariant as any);

    const prices = product.variants.map((v) => v.basePrice);
    const discountedPrices = product.variants
        .map((v) => v.discountedPrice)
        .filter((p): p is number => p !== undefined && p !== null);

    product.minPrice = Math.min(...prices);
    product.maxPrice = Math.max(...prices);
    product.minDiscountedPrice = discountedPrices.length
        ? Math.min(...discountedPrices)
        : undefined;

    // Auto-publish once first variant is added
    if (!product.isPublished && product.variants.length > 0) {
        product.isPublished = true;
    }

    await product.save();
    return product;
};

const getAllVariantsOfAProduct = async (productId: string) => {
    const product = await Product.findById(productId)
        .select("name slug variants")
        .lean();

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    const variants = product.variants || [];

    return {
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        totalVariants: variants.length,
        variants,
    };
};

const getSingleVariantOfAProduct = async (productId: string, variantId: string) => {
    const product = await Product.findById(productId)
        .select("name slug variants")
        .lean();

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    const variant = product.variants?.find(
        (v: any) => v._id.toString() === variantId
    );

    if (!variant) {
        throw new AppError(httpStatus.NOT_FOUND, "Variant not found");
    }

    return {
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        variant,
    };
};

const updateVariant = async (
    productId: string,
    variantId: string,
    payload: any,
    files: Express.Multer.File[],
    imagesToRemove?: string[]
) => {
    const product = await Product.findById(productId);
    if (!product) throw new AppError(httpStatus.NOT_FOUND, "Product not found");

    const variant = product.variants.find(
        (v: any) => v._id.toString() === variantId
    );
    if (!variant) throw new AppError(httpStatus.NOT_FOUND, "Variant not found");

    // Remove old images from Cloudinary
    if (imagesToRemove?.length) {
        await Promise.all(
            imagesToRemove.map(async (url) => {
                const publicId = url.split("/").pop()?.split(".")[0];
                if (publicId) await deleteImageFromCloudinary(publicId);
            })
        );
        variant.images = variant.images.filter((img) => !imagesToRemove.includes(img));
    }

    // Upload new images
    if (files?.length) {
        const newUrls = await Promise.all(
            files.map(async (file, i) => {
                const { secure_url } = await sendImageToCloudinary(
                    `variant-${variantId}-${Date.now()}-${i}`,
                    file.path
                );
                return secure_url;
            })
        );
        variant.images.push(...newUrls);
    }

    // Update fields
    const allowedFields = [
        "name", "description", "design", "size", "color", "packSize",
        "weight", "basePrice", "discountedPrice", "bulkPrice", "stock"
    ];
    for (const field of allowedFields) {
        if (payload[field] !== undefined) {
            (variant as any)[field] = payload[field];
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
        variant.materials = materials.filter((m: any) => m?.materialId);
    }

    // Recalculate price range
    const prices = product.variants.map((v) => v.basePrice);
    const discountedPrices = product.variants
        .map((v) => v.discountedPrice)
        .filter((p): p is number => p !== undefined && p !== null);

    product.minPrice = Math.min(...prices);
    product.maxPrice = Math.max(...prices);
    product.minDiscountedPrice = discountedPrices.length
        ? Math.min(...discountedPrices)
        : undefined;

    await product.save();
    return product;
};

const deleteVariant = async (productId: string, variantId: string) => {
    const product = await Product.findById(productId);
    if (!product) throw new AppError(httpStatus.NOT_FOUND, "Product not found");

    const variant = product.variants.find(
        (v: any) => v._id.toString() === variantId
    );
    if (!variant) throw new AppError(httpStatus.NOT_FOUND, "Variant not found");

    // Delete variant images from Cloudinary
    if (variant.images?.length) {
        await Promise.all(
            variant.images.map(async (url) => {
                const publicId = url.split("/").pop()?.split(".")[0];
                if (publicId) await deleteImageFromCloudinary(publicId);
            })
        );
    }

    // Remove variant
    product.variants = product.variants.filter(
        (v: any) => v._id.toString() !== variantId
    ) as any;

    // Recalculate price range or reset
    if (product.variants.length > 0) {
        const prices = product.variants.map((v) => v.basePrice);
        const discountedPrices = product.variants
            .map((v) => v.discountedPrice)
            .filter((p): p is number => p !== undefined && p !== null);
        product.minPrice = Math.min(...prices);
        product.maxPrice = Math.max(...prices);
        product.minDiscountedPrice = discountedPrices.length
            ? Math.min(...discountedPrices)
            : undefined;
    } else {
        // No variants left → unpublish
        product.minPrice = 0;
        product.maxPrice = 0;
        product.minDiscountedPrice = undefined;
        product.isPublished = false;
    }

    await product.save();
    return product;
};

export const ProductVariantServices = {
    addVariant,
    getAllVariantsOfAProduct,
    getSingleVariantOfAProduct,
    updateVariant,
    deleteVariant
};