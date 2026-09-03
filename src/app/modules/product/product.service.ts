/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Product, { Review } from "./product.model";
import AppError from "../../errors/AppError";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { deleteImageFromCloudinary } from "../../utils/deleteImageFromCloudinary";
import { TProductFilters, TProductSortOptions } from "./product.interface";
import Material from "../materials/materials.model";

// Helper function to calculate product price range
const calculatePriceRange = (variants: any[]) => {
    const prices = variants.map(v => v.basePrice);
    const discountedPrices = variants
        .map(v => v.discountedPrice)
        .filter((p): p is number => p !== undefined && p !== null);

    return {
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        minDiscountedPrice: discountedPrices.length > 0 ? Math.min(...discountedPrices) : undefined,
    };
};

const addProduct = async (
    payload: any,
    files: Express.Multer.File[]
) => {
    // =========================================================
    // 1. Upload Product/Variant Images
    // =========================================================

    let imageUrls: string[] = [];

    if (files?.length) {
        const uploads = files.map(async (file, index) => {
            const { secure_url } = await sendImageToCloudinary(
                `product-${Date.now()}-${index}`,
                file.path
            );

            return secure_url;
        });

        imageUrls = await Promise.all(uploads);
    }

    // =========================================================
    // 2. Parse Variants
    // =========================================================

    let variants = payload.variants || [];

    if (typeof variants === "string") {
        try {
            variants = JSON.parse(variants);
        } catch {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Invalid variants format"
            );
        }
    }

    if (!Array.isArray(variants) || variants.length === 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Product must have at least one variant"
        );
    }

    // =========================================================
    // 3. Process Variants
    // =========================================================

    variants = variants.map((variant: any, index: number) => {
        // -----------------------------
        // Parse Materials
        // -----------------------------

        let materials = variant.materials || [];

        if (typeof materials === "string") {
            try {
                materials = JSON.parse(materials);
            } catch {
                materials = [];
            }
        }

        if (!Array.isArray(materials)) {
            materials = [materials];
        }

        materials = materials
            .filter(
                (material: any) =>
                    material &&
                    material.materialId &&
                    material.materialVariantId
            )
            .map((material: any) => ({
                materialId: material.materialId,
                materialVariantId: material.materialVariantId,
                quantity: Number(material.quantity) || 0,
                unit: material.unit || "piece",
            }));

        // -----------------------------
        // Validate Dimensions
        // -----------------------------

        const dimensions = variant.dimensions;

        if (
            !dimensions ||
            dimensions.length === undefined ||
            dimensions.width === undefined ||
            dimensions.height === undefined
        ) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Dimensions are required for variant ${index + 1}`
            );
        }

        // -----------------------------
        // Return Variant
        // -----------------------------

        return {
            name: variant.name,
            description: variant.description,

            packageContents: Array.isArray(variant.packageContents)
                ? variant.packageContents
                : [],

            images: imageUrls,

            design: variant.design,
            size: variant.size,
            color: variant.color,

            packSize: variant.packSize || "Single",

            dimensions: {
                length: Number(dimensions.length),
                width: Number(dimensions.width),
                height: Number(dimensions.height),
                unit: dimensions.unit || "cm",
            },

            weight: variant.weight,

            basePrice: Number(variant.basePrice),

            discountedPrice:
                variant.discountedPrice !== undefined &&
                variant.discountedPrice !== null
                    ? Number(variant.discountedPrice)
                    : undefined,

            bulkPrice:
                variant.bulkPrice !== undefined &&
                variant.bulkPrice !== null
                    ? Number(variant.bulkPrice)
                    : undefined,

            stock:
                variant.stock !== undefined &&
                variant.stock !== null
                    ? Number(variant.stock)
                    : 0,

            materials,
        };
    });

    // =========================================================
    // 4. Calculate Price Range
    // =========================================================

    const {
        minPrice,
        maxPrice,
        minDiscountedPrice,
    } = calculatePriceRange(variants);

    // =========================================================
    // 5. Parse Occasion Names
    // =========================================================

    let occasionNames = payload.occasionNames || [];

    if (typeof occasionNames === "string") {
        try {
            occasionNames = JSON.parse(occasionNames);
        } catch {
            occasionNames = occasionNames
                .split(",")
                .map((name: string) => name.trim());
        }
    }

    if (!Array.isArray(occasionNames)) {
        occasionNames = [occasionNames];
    }

    occasionNames = occasionNames.filter(
        (name: string) => name && name.trim() !== ""
    );

    if (occasionNames.length === 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "At least one occasion is required"
        );
    }

    // =========================================================
    // 6. Parse Sub Occasion Names
    // =========================================================

    let subOccasionNames = payload.subOccasionNames || [];

    if (typeof subOccasionNames === "string") {
        try {
            subOccasionNames = JSON.parse(subOccasionNames);
        } catch {
            subOccasionNames = subOccasionNames
                .split(",")
                .map((name: string) => name.trim());
        }
    }

    if (!Array.isArray(subOccasionNames)) {
        subOccasionNames = [subOccasionNames];
    }

    subOccasionNames = subOccasionNames.filter(
        (name: string) => name && name.trim() !== ""
    );

    // =========================================================
    // 7. Parse Tags
    // =========================================================

    let tags = payload.tags || [];

    if (typeof tags === "string") {
        try {
            tags = JSON.parse(tags);
        } catch {
            tags = tags
                .split(",")
                .map((tag: string) => tag.trim());
        }
    }

    if (!Array.isArray(tags)) {
        tags = [tags];
    }

    tags = tags.filter(
        (tag: string) => tag && tag.trim() !== ""
    );

    // =========================================================
    // 8. Parse Care Instructions
    // =========================================================

    let careInstructions = payload.careInstructions || [];

    if (typeof careInstructions === "string") {
        try {
            careInstructions = JSON.parse(careInstructions);
        } catch {
            careInstructions = careInstructions
                .split(",")
                .map((instruction: string) => instruction.trim());
        }
    }

    if (!Array.isArray(careInstructions)) {
        careInstructions = [careInstructions];
    }

    careInstructions = careInstructions.filter(
        (instruction: string) =>
            instruction && instruction.trim() !== ""
    );

    // =========================================================
    // 9. Parse Customization
    // =========================================================

    let isCustomizationAvailable = false;

    if (payload.isCustomizationAvailable !== undefined) {
        if (typeof payload.isCustomizationAvailable === "string") {
            isCustomizationAvailable =
                payload.isCustomizationAvailable.toLowerCase() === "true";
        } else {
            isCustomizationAvailable = Boolean(
                payload.isCustomizationAvailable
            );
        }
    }

    // =========================================================
    // 10. Processing Time
    // =========================================================

    const processingTime =
        payload.processingTime &&
        String(payload.processingTime).trim() !== ""
            ? payload.processingTime
            : null;

    // =========================================================
    // 11. Boolean Fields
    // =========================================================

    let isActive = true;

    if (payload.isActive !== undefined) {
        if (typeof payload.isActive === "string") {
            isActive = payload.isActive.toLowerCase() === "true";
        } else {
            isActive = Boolean(payload.isActive);
        }
    }

    let isFeatured = false;

    if (payload.isFeatured !== undefined) {
        if (typeof payload.isFeatured === "string") {
            isFeatured = payload.isFeatured.toLowerCase() === "true";
        } else {
            isFeatured = Boolean(payload.isFeatured);
        }
    }

    // =========================================================
    // 12. Create Product Data
    // =========================================================

    const productData = {
        name: payload.name,
        category: payload.category,
        subCategory: payload.subCategory,

        occasionNames,
        subOccasionNames,

        careInstructions,

        isCustomizationAvailable,
        processingTime,

        variants,

        minPrice,
        maxPrice,
        minDiscountedPrice,

        tags,

        isActive,
        isFeatured,
    };

    // =========================================================
    // 13. Create Product
    // =========================================================

    const product = await Product.create(productData);

    return product;
};

/* Get All Products with Advanced Filtering and Sorting */
const getAllProducts = async (
    filters: TProductFilters,
    sortOption: TProductSortOptions = { field: 'newest' },
    skip = 0,
    limit = 10
) => {
    const query: any = { isActive: true };

    // Category filter - Support array
    if (filters.category && filters.category.length > 0) {
        query.category = {
            $in: filters.category.map((cat: string) => new RegExp(`^${cat}$`, 'i'))
        };
    }

    // SubCategory filter - Support array
    if (filters.subCategory && filters.subCategory.length > 0) {
        query.subCategory = {
            $in: filters.subCategory.map((sub: string) => new RegExp(`^${sub}$`, 'i'))
        };
    }

    // Occasion names filter - Support array
    if (filters.occasionNames && filters.occasionNames.length > 0) {
        query.occasionNames = {
            $in: filters.occasionNames.map((name: string) => new RegExp(`^${name}$`, 'i'))
        };
    }

    // Sub-occasion names filter - Support array
    if (filters.subOccasionNames && filters.subOccasionNames.length > 0) {
        query.subOccasionNames = {
            $in: filters.subOccasionNames.map((name: string) => new RegExp(`^${name}$`, 'i'))
        };
    }

    // Material filter - Support array (search in variant materials array)
    if (filters.material && filters.material.length > 0) {
        query['variants.materials.materialId'] = {
            $in: filters.material.map((mat: string) => new RegExp(`^${mat}$`, 'i'))
        };
    }

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const priceConditions: any[] = [];

        const priceCondition: any = {};
        if (filters.minPrice !== undefined) priceCondition.$gte = filters.minPrice;
        if (filters.maxPrice !== undefined) priceCondition.$lte = filters.maxPrice;

        if (Object.keys(priceCondition).length > 0) {
            priceConditions.push({ minPrice: priceCondition });
            priceConditions.push({ minDiscountedPrice: priceCondition });
        }

        if (priceConditions.length > 0) {
            query.$or = priceConditions;
        }
    }

    // Rating filter
    if (filters.minRating) {
        query.averageRating = { $gte: filters.minRating };
    }

    // In stock filter
    if (filters.inStock !== undefined) {
        query['variants'] = {
            $elemMatch: {
                stock: filters.inStock ? { $gt: 0 } : { $eq: 0 }
            }
        };
    }

    // Featured filter
    if (filters.isFeatured !== undefined) {
        query.isFeatured = filters.isFeatured;
    }

    // Search filter (text search)
    if (filters.keyword) {
        query.$text = {
            $search: filters.keyword,
        };
    }

    // Sorting logic
    let sortCriteria: any = {};
    switch (sortOption.field) {
        case 'price_low_to_high':
            sortCriteria = { minPrice: 1 };
            break;
        case 'price_high_to_low':
            sortCriteria = { minPrice: -1 };
            break;
        case 'popular':
            sortCriteria = { soldCount: -1 };
            break;
        case 'top_rated':
            sortCriteria = { averageRating: -1, totalReviews: -1 };
            break;
        case 'newest':
        default:
            sortCriteria = { createdAt: -1 };
            break;
    }

    // Get total count
    const total = await Product.countDocuments(query);

    // Get products with pagination and sorting
    const products = await Product.find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean();

    // Transform response to include variant count, stock status, and material details
    const transformedData = await Promise.all(
        products.map(async (product: any) => {
            // Process each variant to find and attach material variant details
            const enrichedVariants = await Promise.all(
                product.variants.map(async (variant: any) => {
                    // Check if variant has materials array
                    if (!variant.materials || variant.materials.length === 0) {
                        return variant;
                    }

                    // Enrich each material in the array
                    const enrichedMaterials = await Promise.all(
                        variant.materials.map(async (materialRef: any) => {
                            try {
                                // Find the material document
                                const material = await Material.findById(materialRef.materialId).lean();

                                if (!material) {
                                    return materialRef;
                                }

                                // Find the specific material variant
                                const materialVariant = material.variants.find(
                                    (v: any) => v._id.toString() === materialRef.materialVariantId.toString()
                                );

                                if (!materialVariant) {
                                    return materialRef;
                                }

                                // Return enriched material
                                return {
                                    materialId: materialRef.materialId,
                                    materialVariantId: materialRef.materialVariantId,
                                    quantity: materialRef.quantity,
                                    unit: materialRef.unit,
                                    // Material variant details
                                    design: materialVariant.design,
                                    color: materialVariant.color,
                                    madeOf: materialVariant.madeOf,
                                    purchasePrice: materialVariant.purchasePrice,
                                    stockUnit: materialVariant.stockUnit,
                                    // Material basic info
                                    materialName: material.name,
                                    materialCategory: material.category,
                                };
                            } catch (error) {
                                return materialRef;
                            }
                        })
                    );

                    return {
                        ...variant,
                        materials: enrichedMaterials,
                    };
                })
            );

            return {
                ...product,
                variants: enrichedVariants,
                totalStock: product.variants.reduce((acc: number, v: any) => acc + v.stock, 0),
                variantCount: product.variants.length,
                inStock: product.variants.some((v: any) => v.stock > 0),
            };
        })
    );

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(skip / limit) + 1;

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

/* Get Single Product */
// Helper function to enrich materials array
const enrichMaterialsArray = async (materials: any[]) => {
    if (!materials || materials.length === 0) {
        return materials;
    }

    return await Promise.all(
        materials.map(async (materialRef: any) => {
            try {
                const material = await Material.findById(materialRef.materialId).lean();

                if (!material) {
                    return materialRef;
                }

                const materialVariant = material.variants.find(
                    (v: any) => v._id.toString() === materialRef.materialVariantId.toString()
                );

                if (!materialVariant) {
                    return materialRef;
                }

                return {
                    materialId: materialRef.materialId,
                    materialVariantId: materialRef.materialVariantId,
                    quantity: materialRef.quantity,
                    unit: materialRef.unit,
                    // Material variant details
                    design: materialVariant.design,
                    color: materialVariant.color,
                    madeOf: materialVariant.madeOf,
                    purchasePrice: materialVariant.purchasePrice,
                    stockUnit: materialVariant.stockUnit,
                    // Material basic info
                    materialName: material.name,
                    materialCategory: material.category,
                };
            } catch (error) {
                return materialRef;
            }
        })
    );
};

// Helper function to enrich variants with materials array
const enrichVariantsWithMaterials = async (variants: any[]) => {
    return await Promise.all(
        variants.map(async (variant: any) => {
            // Check if variant has materials array
            if (!variant.materials || variant.materials.length === 0) {
                return variant;
            }

            const enrichedMaterials = await enrichMaterialsArray(variant.materials);

            return {
                ...variant,
                materials: enrichedMaterials,
            };
        })
    );
};

const getSingleProductById = async (productId: string) => {
    const product = await Product.findById(productId)
        .populate({
            path: "reviews",
            populate: {
                path: "user",
                select: "name profileImage",
            },
        });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Increment click count
    await Product.findByIdAndUpdate(productId, {
        $inc: { totalClicks: 1 },
    });

    const productObj = product.toObject();

    // Enrich variants with material details
    const enrichedVariants = await enrichVariantsWithMaterials(productObj.variants);

    return {
        ...productObj,
        variants: enrichedVariants,
        totalStock: productObj.variants.reduce((acc: number, v: any) => acc + v.stock, 0),
        inStock: productObj.variants.some((v: any) => v.stock > 0),
    };
};

const getSingleProductBySlug = async (slug: string) => {
    const product = await Product.findOne({ slug })
        .populate({
            path: "reviews",
            populate: {
                path: "user",
                select: "name profileImage",
            },
        });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Increment click count
    await Product.findOneAndUpdate(
        { slug },
        { $inc: { totalClicks: 1 } }
    );

    const productObj = product.toObject();

    // Enrich variants with material details
    const enrichedVariants = await enrichVariantsWithMaterials(productObj.variants);

    return {
        ...productObj,
        variants: enrichedVariants,
        totalStock: productObj.variants.reduce((acc: number, v: any) => acc + v.stock, 0),
        inStock: productObj.variants.some((v: any) => v.stock > 0),
    };
};

/* Update Product */
const updateProduct = async (
    productId: string,
    payload: any,
    files: Express.Multer.File[],
    imagesToRemove?: string[]
) => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Handle image removal
    let imageUrls = product.images || [];
    if (imagesToRemove && imagesToRemove.length > 0) {
        // Remove images from Cloudinary
        await Promise.all(
            imagesToRemove.map(async (url: string) => {
                const publicId = url.split("/").pop()?.split(".")[0];
                if (publicId) {
                    await deleteImageFromCloudinary(publicId);
                }
            })
        );
        // Filter out removed images
        imageUrls = imageUrls.filter(url => !imagesToRemove.includes(url));
    }

    // Upload new images
    if (files?.length) {
        const uploads = files.map(async (file, index) => {
            const { secure_url } = await sendImageToCloudinary(
                `product-${Date.now()}-${index}`,
                file.path
            );
            return secure_url;
        });
        const uploadedImages = await Promise.all(uploads);
        imageUrls = [...imageUrls, ...uploadedImages];
    }

    // Process variants update
    let variants = product.variants;
    if (payload.variants) {
        variants = typeof payload.variants === 'string'
            ? JSON.parse(payload.variants)
            : payload.variants;

        // Generate SKUs for new variants without SKU
        variants = variants.map((variant: any) => ({
            ...variant,
            stock: variant.stock || 0,
        }));
    }

    // Recalculate price range
    const { minPrice, maxPrice, minDiscountedPrice } = calculatePriceRange(variants);

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
            ...payload,
            images: imageUrls,
            variants,
            minPrice,
            maxPrice,
            minDiscountedPrice,
        },
        { new: true }
    );

    return updatedProduct;
};

/* Delete Product */
const deleteProduct = async (productId: string) => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Delete all images from Cloudinary
    if (product.images?.length) {
        await Promise.all(
            product.images.map(async (url: string) => {
                const publicId = url.split("/").pop()?.split(".")[0];
                if (publicId) {
                    await deleteImageFromCloudinary(publicId);
                }
            })
        );
    }

    // Delete all reviews
    if (product.reviews?.length) {
        await Review.deleteMany({ _id: { $in: product.reviews } });
    }

    await Product.findByIdAndDelete(productId);

    return true;
};

/* Add Review to Product */
const addReview = async (
    productId: string,
    userId: string,
    rating: number,
    comment: string,
    images?: string[]
) => {
    // Check if user has purchased the product (optional)
    // You can add order check here

    const review = await Review.create({
        user: userId,
        rating,
        comment,
        images: images || [],
    });

    const product = await Product.findByIdAndUpdate(
        productId,
        {
            $push: { reviews: review._id },
            $inc: { totalReviews: 1 },
        },
        { new: true }
    );

    // Update average rating
    const allReviews = await Review.find({ _id: { $in: product?.reviews } });
    const averageRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

    await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    });

    return review;
};

/* Get Product Reviews */
const getProductReviews = async (productId: string, skip = 0, limit = 10) => {
    const product = await Product.findById(productId).select('reviews');
    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    const reviews = await Review.find({ _id: { $in: product.reviews } })
        .populate('user', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Review.countDocuments({ _id: { $in: product.reviews } });

    return {
        data: reviews,
        total,
        pages: Math.ceil(total / limit),
    };
};

export const ProductServices = {
    addProduct,
    getAllProducts,
    getSingleProductById,
    getSingleProductBySlug,
    updateProduct,
    deleteProduct,
    addReview,
    getProductReviews,
};