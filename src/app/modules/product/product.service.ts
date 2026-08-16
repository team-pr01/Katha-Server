/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Product, { Review } from "./product.model";
import AppError from "../../errors/AppError";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { infinitePaginate } from "../../utils/infinitePaginate";
import { deleteImageFromCloudinary } from "../../utils/deleteImageFromCloudinary";
import { TProductFilters, TProductSortOptions } from "./product.interface";

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
    // Upload main product images
    let imageUrls: string[] = [];
    if (files.length) {
        const uploads = files.map(async (file, index) => {
            const { secure_url } = await sendImageToCloudinary(
                `product-${Date.now()}-${index}`,
                file.path
            );
            return secure_url;
        });
        imageUrls = await Promise.all(uploads);
    }

    // Process variants
    let variants = [];
    if (payload.variants) {
        variants = typeof payload.variants === 'string'
            ? JSON.parse(payload.variants)
            : payload.variants;

        variants = variants.map((variant: any) => ({
            ...variant,
            stock: variant.stock || 0,
        }));
    }

    // Validate variants exist
    if (!variants || variants.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Product must have at least one variant");
    }

    // Calculate price range
    const { minPrice, maxPrice, minDiscountedPrice } = calculatePriceRange(variants);

    // Handle occasion names - parse if string
    let occasionNames = payload.occasionNames || [];
    if (typeof occasionNames === 'string') {
        try {
            occasionNames = JSON.parse(occasionNames);
        } catch {
            occasionNames = occasionNames.split(',').map((n: string) => n.trim());
        }
    }

    if (!Array.isArray(occasionNames)) {
        occasionNames = [occasionNames];
    }

    // Validate occasion names exist
    if (!occasionNames || occasionNames.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "At least one occasion is required");
    }

    // Filter out empty strings
    occasionNames = occasionNames.filter((n: string) => n && n.trim() !== '');

    // Handle sub-occasion names - parse if string
    let subOccasionNames = payload.subOccasionNames || [];
    if (typeof subOccasionNames === 'string') {
        try {
            subOccasionNames = JSON.parse(subOccasionNames);
        } catch {
            subOccasionNames = subOccasionNames.split(',').map((n: string) => n.trim());
        }
    }

    if (!Array.isArray(subOccasionNames)) {
        subOccasionNames = [subOccasionNames];
    }

    subOccasionNames = subOccasionNames.filter((n: string) => n && n.trim() !== '');

    // Handle material - parse if string
    let material = payload.material || [];
    if (typeof material === 'string') {
        try {
            material = JSON.parse(material);
        } catch {
            material = material.split(',').map((m: string) => m.trim());
        }
    }

    if (!Array.isArray(material)) {
        material = [material];
    }
    material = material.filter((m: string) => m && m.trim() !== '');

    // Handle tags - parse if string
    let tags = payload.tags || [];
    if (typeof tags === 'string') {
        try {
            tags = JSON.parse(tags);
        } catch {
            tags = tags.split(',').map((t: string) => t.trim());
        }
    }

    if (!Array.isArray(tags)) {
        tags = [tags];
    }
    tags = tags.filter((t: string) => t && t.trim() !== '');

    // Create product with all fields
    const productData = {
        name: payload.name,
        category: payload.category,
        description: payload.description,
        images: imageUrls,
        variants,
        minPrice,
        maxPrice,
        minDiscountedPrice,
        occasionNames: occasionNames,
        subOccasionNames: subOccasionNames,
        material: material,
        tags: tags,
        isActive: payload.isActive !== undefined ? payload.isActive : true,
        isFeatured: payload.isFeatured || false,
    };

    const product = await Product.create(productData);

    return product;
};

/* Get All Products with Advanced Filtering and Sorting */
const getAllProducts = async (
    filters: TProductFilters = {},
    sortOption: TProductSortOptions = { field: 'newest' },
    skip = 0,
    limit = 10
) => {
    const query: any = { isActive: true };

    // Category filter
    if (filters.category) {
        query.category = filters.category;
    }

    // Occasion names filter - Check if ANY occasion matches
    if (filters.occasionNames && filters.occasionNames.length > 0) {
        // Use $in for case-insensitive matching
        query.occasionNames = {
            $in: filters.occasionNames.map((name: string) => new RegExp(`^${name}$`, 'i'))
        };
    }

    // Sub-occasion names filter - Check if ANY sub-occasion matches
    if (filters.subOccasionNames && filters.subOccasionNames.length > 0) {
        // Use $in for case-insensitive matching
        query.subOccasionNames = {
            $in: filters.subOccasionNames.map((name: string) => new RegExp(`^${name}$`, 'i'))
        };
    }

    // Material filter (array intersection)
    if (filters.material && filters.material.length > 0) {
        query.material = { $in: filters.material };
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
    if (filters.search) {
        query.$text = {
            $search: filters.search,
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

    // Get products with pagination and sorting
    const result = await infinitePaginate(
        Product,
        query,
        skip,
        limit,
        [],
        sortCriteria,
    );

    // Transform response to include variant count and stock status
    const transformedData = result.data.map((product: any) => ({
        ...product.toObject(),
        totalStock: product.variants.reduce((acc: number, v: any) => acc + v.stock, 0),
        variantCount: product.variants.length,
        inStock: product.variants.some((v: any) => v.stock > 0),
    }));

    return {
        ...result,
        data: transformedData,
    };
};

/* Get Single Product */
const getSingleProductById = async (productId: string) => {
    const product = await Product.findById(productId)
        .populate("addedBy", "name role shopName")
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
    return {
        ...productObj,
        totalStock: productObj.variants.reduce((acc: number, v: any) => acc + v.stock, 0),
        inStock: productObj.variants.some((v: any) => v.stock > 0),
    };
};

const getSingleProductBySlug = async (slug: string) => {
  const result = await Product.findOne({ slug });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  return result;
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