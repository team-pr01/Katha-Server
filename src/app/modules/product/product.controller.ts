/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProductServices } from "./product.service";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";

const addProduct = catchAsync(async (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];

  const result = await ProductServices.addProduct(
    req.body,
    files
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Product added successfully",
    data: result,
  });
});

/* Get All Products with Filtering and Sorting */
const getAllProducts = catchAsync(async (req, res) => {
  const {
    category,
    subCategory,
    occasionNames,
    subOccasionNames,
    material,
    minPrice,
    maxPrice,
    keyword,
    minRating,
    inStock,
    isFeatured,
    sortBy = 'newest',
    skip = "0",
    limit = "10"
  } = req.query;

  // Build filters object - Parse arrays from comma-separated strings
  const filters = {
    category: category ? (category as string).split(',').map(c => c.trim()) : undefined,
    subCategory: subCategory ? (subCategory as string).split(',').map(c => c.trim()) : undefined,
    occasionNames: occasionNames ? (occasionNames as string).split(',').map(c => c.trim()) : undefined,
    subOccasionNames: subOccasionNames ? (subOccasionNames as string).split(',').map(c => c.trim()) : undefined,
    material: material ? (material as string).split(',').map(c => c.trim()) : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    keyword: keyword as string,
    minRating: minRating ? Number(minRating) : undefined,
    inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
    isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
  };

  // Build sort options
  const sortOption = { field: sortBy as any };

  const result = await ProductServices.getAllProducts(
    filters,
    sortOption,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Products fetched successfully",
    data: result,
  });
});
/* Get Single Product */
const getSingleProductById = catchAsync(async (req, res) => {
  const { productId } = req.params;

  const result = await ProductServices.getSingleProductById(productId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product fetched successfully",
    data: result,
  });
});

const getSingleProductBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  const result = await ProductServices.getSingleProductBySlug(slug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product fetched successfully",
    data: result,
  });
});

/* Update Product */
const updateProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const files = (req.files as Express.Multer.File[]) || [];
  const { imagesToRemove, ...updateData } = req.body;

  const imagesToRemoveArray = imagesToRemove
    ? (typeof imagesToRemove === 'string' ? JSON.parse(imagesToRemove) : imagesToRemove)
    : [];

  const result = await ProductServices.updateProduct(
    productId,
    updateData,
    files,
    imagesToRemoveArray
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product updated successfully",
    data: result,
  });
});

/* Delete Product */
const deleteProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;

  const result = await ProductServices.deleteProduct(
    productId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product deleted successfully",
    data: result,
  });
});

/* Add Review */
const addReview = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  const files = (req.files as Express.Multer.File[]) || [];

  let imageUrls: string[] = [];
  if (files.length) {
    // Upload review images (you can reuse the same utility)
    const uploads = files.map(async (file, index) => {
      const { secure_url } = await sendImageToCloudinary(
        `review-${Date.now()}-${index}`,
        file.path
      );
      return secure_url;
    });
    imageUrls = await Promise.all(uploads);
  }

  const result = await ProductServices.addReview(
    productId,
    req.user.userId,
    Number(rating),
    comment,
    imageUrls
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review added successfully",
    data: result,
  });
});

/* Get Product Reviews */
const getProductReviews = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const { skip = "0", limit = "10" } = req.query;

  const result = await ProductServices.getProductReviews(
    productId,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product reviews fetched successfully",
    data: result,
  });
});

export const ProductControllers = {
  addProduct,
  getAllProducts,
  getSingleProductById,
  getSingleProductBySlug,
  updateProduct,
  deleteProduct,
  addReview,
  getProductReviews,
};