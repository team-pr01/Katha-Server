/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { TCategories, TCategoryFilters } from "./categories.interface";
import Categories from "./categories.model";
import AppError from "../../errors/AppError";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { deleteImageFromCloudinary } from "../../utils/deleteImageFromCloudinary";
import { infinitePaginate } from "../../utils/infinitePaginate";
import Product from "../product/product.model";

// Add a category with image upload
const addCategory = async (
  payload: Partial<TCategories>,
  file: Express.Multer.File | undefined
) => {
  // Check if category already exists
  const existingCategory = await Categories.findOne({
    name: { $regex: new RegExp(`^${payload.name}$`, "i") },
  });

  if (existingCategory) {
    throw new AppError(httpStatus.CONFLICT, "Category already exists");
  }

  // Upload image to Cloudinary
  let imageUrl = "";
  if (file) {
    const { secure_url } = await sendImageToCloudinary(
      `category-${Date.now()}`,
      file.path
    );
    imageUrl = secure_url;
  } else if (!payload.imageUrl) {
    throw new AppError(httpStatus.BAD_REQUEST, "Category image is required");
  }

  // Parse subCategories if it's a string
  let subCategories: string[] = [];
  if (payload.subCategories) {
    if (typeof payload.subCategories === "string") {
      const rawSubCategories = String(payload.subCategories).trim();

      try {
        const parsedSubCategories = JSON.parse(rawSubCategories);
        if (Array.isArray(parsedSubCategories)) {
          subCategories = parsedSubCategories
            .map((item: string) => String(item).trim())
            .filter(Boolean);
        } else if (typeof parsedSubCategories === "string") {
          subCategories = parsedSubCategories
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean);
        }
      } catch {
        // If JSON parse fails, try splitting by comma
        subCategories = rawSubCategories
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean);
      }
    } else if (Array.isArray(payload.subCategories)) {
      subCategories = payload.subCategories
        .map((item) => String(item).trim())
        .filter(Boolean);
    }
  }

  const categoryData = {
    name: payload.name,
    areaName: payload.areaName,
    description: payload.description,
    imageUrl: imageUrl || payload.imageUrl,
    subCategories: subCategories,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
  };

  const result = await Categories.create(categoryData);
  return result;
};

// Get all categories with filters and pagination
const getAllCategories = async (
  filters: TCategoryFilters = {},
  skip = 0,
  limit = 10
) => {
  const query: any = {};

  // Apply filters
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  if (filters.areaName) {
    query.areaName = { $regex: new RegExp(`^${filters.areaName}$`, "i") };
  }

  if (filters.search) {
    query.$text = {
      $search: filters.search,
    };
  }

  // Get categories with pagination
  const categories = await Categories.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Categories.countDocuments(query);

  // Get product counts for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category: any) => {
      // Count products for this category
      const productCount = await Product.countDocuments({
        category: category.name,
        isActive: true,
      });

      // Get sub-category product counts
      let subCategoryCounts: any[] = [];
      if (category.subCategories && category.subCategories.length > 0) {
        subCategoryCounts = await Promise.all(
          category.subCategories.map(async (subCategory: string) => {
            const count = await Product.countDocuments({
              category: category.name,
              subCategory: subCategory,
              isActive: true,
            });
            return {
              name: subCategory,
              productCount: count,
            };
          })
        );
      }

      return {
        ...category,
        productCount,
        subCategories: subCategoryCounts.length > 0 ? subCategoryCounts : category.subCategories,
      };
    })
  );

  return {
    data: categoriesWithCounts,
    meta: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: Math.floor(skip / limit) + 1,
      limit,
      skip,
    },
  };
};

// Get categories by area name (with pagination)
const getCategoriesByAreaName = async (
  areaName: string,
  skip = 0,
  limit = 10
) => {
  const query: any = {
    areaName: { $regex: new RegExp(`^${areaName}$`, "i") },
    isActive: true,
  };

  // Get categories with pagination using infinitePaginate
  const result = await infinitePaginate(
    Categories,
    query,
    skip,
    limit,
    [], // populate options
    { name: 1 } // sort criteria (alphabetical)
  );

  // Get product counts for each category
  const categoriesWithCounts = await Promise.all(
    result.data.map(async (category: any) => {
      // Count products for this category
      const productCount = await Product.countDocuments({
        category: category.name,
        isActive: true,
      });

      // Get sub-category product counts
      let subCategoryCounts: any[] = [];
      if (category.subCategories && category.subCategories.length > 0) {
        subCategoryCounts = await Promise.all(
          category.subCategories.map(async (subCategory: string) => {
            const count = await Product.countDocuments({
              category: category.name,
              subCategory: subCategory,
              isActive: true,
            });
            return {
              name: subCategory,
              productCount: count,
            };
          })
        );
      }

      return {
        ...category,
        productCount,
        subCategories: subCategoryCounts.length > 0 ? subCategoryCounts : category.subCategories,
      };
    })
  );

  return {
    ...result,
    data: categoriesWithCounts,
  };
};

// Get single category by ID
const getSingleCategoryById = async (categoryId: string) => {
  const category = await Categories.findById(categoryId);

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  // Get product count for this category
  const productCount = await Product.countDocuments({
    category: category.name,
    isActive: true,
  });

  // Get sub-category product counts
  let subCategoryCounts: any[] = [];
  if (category.subCategories && category.subCategories.length > 0) {
    subCategoryCounts = await Promise.all(
      category.subCategories.map(async (subCategory: string) => {
        const count = await Product.countDocuments({
          category: category.name,
          subCategory: subCategory,
          isActive: true,
        });
        return {
          name: subCategory,
          productCount: count,
        };
      })
    );
  }

  return {
    ...category.toObject(),
    productCount,
    subCategories: subCategoryCounts.length > 0 ? subCategoryCounts : category.subCategories,
  };
};

// Get single category by name with product count
const getCategoryByName = async (name: string) => {
  const category = await Categories.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
    isActive: true,
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  // Get product count for this category
  const productCount = await Product.countDocuments({
    category: category.name,
    isActive: true,
  });

  // Get sub-category product counts
  let subCategoryCounts: any[] = [];
  if (category.subCategories && category.subCategories.length > 0) {
    subCategoryCounts = await Promise.all(
      category.subCategories.map(async (subCategory: string) => {
        const count = await Product.countDocuments({
          category: category.name,
          subCategory: subCategory,
          isActive: true,
        });
        return {
          name: subCategory,
          productCount: count,
        };
      })
    );
  }

  return {
    ...category.toObject(),
    productCount,
    subCategories: subCategoryCounts.length > 0 ? subCategoryCounts : category.subCategories,
  };
};

// Update category
const updateCategory = async (
  categoryId: string,
  payload: Partial<TCategories>,
  file: Express.Multer.File | undefined,
  imagesToRemove?: string[]
) => {
  const category = await Categories.findById(categoryId);

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  // Handle image update
  let imageUrl = category.imageUrl;

  // Remove old image if requested
  if (imagesToRemove && imagesToRemove.length > 0) {
    const publicId = category.imageUrl.split("/").pop()?.split(".")[0];
    if (publicId) {
      await deleteImageFromCloudinary(publicId);
    }
    imageUrl = "";
  }

  // Upload new image if provided
  if (file) {
    const { secure_url } = await sendImageToCloudinary(
      `category-${Date.now()}`,
      file.path
    );
    imageUrl = secure_url;
  }

  const updatedCategory = await Categories.findByIdAndUpdate(
    categoryId,
    {
      ...payload,
      imageUrl: imageUrl || payload.imageUrl,
    },
    { new: true }
  );

  return updatedCategory;
};

// Delete category
const deleteCategory = async (categoryId: string) => {
  const category = await Categories.findById(categoryId);

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  // Delete image from Cloudinary
  if (category.imageUrl) {
    const publicId = category.imageUrl.split("/").pop()?.split(".")[0];
    if (publicId) {
      await deleteImageFromCloudinary(publicId);
    }
  }

  // Check if any products are using this category
  // If you have a Product model, you can check here
  // const productCount = await Product.countDocuments({ category: category.name });
  // if (productCount > 0) {
  //   throw new AppError(httpStatus.CONFLICT, `Cannot delete category. ${productCount} products are associated with it.`);
  // }

  await Categories.findByIdAndDelete(categoryId);

  return true;
};

export const CategoryServices = {
  addCategory,
  getAllCategories,
  getCategoriesByAreaName,
  getSingleCategoryById,
  getCategoryByName,
  updateCategory,
  deleteCategory,
};