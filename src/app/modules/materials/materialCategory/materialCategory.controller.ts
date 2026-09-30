import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { MaterialCategoryServices } from "./materialCategory.service";

// Add
const addMaterialCategory = catchAsync(async (req, res) => {
    const result = await MaterialCategoryServices.addMaterialCategory(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Material category added successfully",
        data: result,
    });
});

// Get All
const getAllMaterialCategories = catchAsync(async (req, res) => {
    const { search, skip = "0", limit = "10" } = req.query;

    const result = await MaterialCategoryServices.getAllMaterialCategories(
        { search },
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Material categories fetched successfully",
        data: result,
    });
});

// Get Single
const getSingleMaterialCategory = catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await MaterialCategoryServices.getSingleMaterialCategory(id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Material category fetched successfully",
        data: result,
    });
});

// Update
const updateMaterialCategory = catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await MaterialCategoryServices.updateMaterialCategory(
        id,
        req.body
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Material category updated successfully",
        data: result,
    });
});

// Delete
const deleteMaterialCategory = catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await MaterialCategoryServices.deleteMaterialCategory(id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Material category deleted successfully",
        data: result,
    });
});

export const MaterialCategoryControllers = {
    addMaterialCategory,
    getAllMaterialCategories,
    getSingleMaterialCategory,
    updateMaterialCategory,
    deleteMaterialCategory,
};