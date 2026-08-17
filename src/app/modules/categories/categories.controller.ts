import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CategoryServices } from "./categories.services";

// Add category
const addCategory = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File | undefined;

  const result = await CategoryServices.addCategory(req.body, file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Category added successfully",
    data: result,
  });
});

// Get all categories
const getAllCategories = catchAsync(async (req, res) => {
  const { search, areaName, isActive, skip = "0", limit = "10" } = req.query;

  const filters = {
    search: search as string,
    areaName: areaName as string,
    isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
  };

  const result = await CategoryServices.getAllCategories(
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories fetched successfully",
    data: result,
  });
});

// Get categories by area name
const getCategoriesByAreaName = catchAsync(async (req, res) => {
  const { areaName } = req.params;
  const { skip = "0", limit = "10" } = req.query;

  const result = await CategoryServices.getCategoriesByAreaName(
    areaName,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories fetched successfully",
    data: result,
  });
});

// Get single category
const getSingleCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;

  const result = await CategoryServices.getSingleCategoryById(categoryId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category fetched successfully",
    data: result,
  });
});

// Update category
const updateCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const file = req.file as Express.Multer.File | undefined;
  const { imagesToRemove, ...updateData } = req.body;

  const imagesToRemoveArray = imagesToRemove
    ? typeof imagesToRemove === "string"
      ? JSON.parse(imagesToRemove)
      : imagesToRemove
    : [];

  const result = await CategoryServices.updateCategory(
    categoryId,
    updateData,
    file,
    imagesToRemoveArray
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category updated successfully",
    data: result,
  });
});

// Delete category
const deleteCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;

  const result = await CategoryServices.deleteCategory(categoryId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category deleted successfully",
    data: result,
  });
});

export const CategoryControllers = {
  addCategory,
  getAllCategories,
  getCategoriesByAreaName,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};