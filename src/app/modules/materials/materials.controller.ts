import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { MaterialServices } from "./materials.service";
import sendResponse from "../../utils/sendResponse";

// Add Material
const addMaterial = catchAsync(async (req, res) => {
    const result = await MaterialServices.addMaterial(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Material added successfully",
        data: result,
    });
});

// Get All Materials
const getAllMaterials = catchAsync(async (req, res) => {
    const {
        search,
        category,
        subCategory,
        madeOf,
        isActive,
        skip = "0",
        limit = "10",
    } = req.query;

    const filters = {
        search: search as string,
        category: category as string,
        subCategory: subCategory as string,
        madeOf: madeOf as string,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
    };

    const result = await MaterialServices.getAllMaterials(
        filters,
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Materials fetched successfully",
        data: result,
    });
});

// Get Single Material
const getSingleMaterial = catchAsync(async (req, res) => {
    const { materialId } = req.params;

    const result = await MaterialServices.getSingleMaterial(materialId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Material fetched successfully",
        data: result,
    });
});

// Update Material
const updateMaterial = catchAsync(async (req, res) => {
    const { materialId } = req.params;

    const result = await MaterialServices.updateMaterial(materialId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Material updated successfully",
        data: result,
    });
});

// Delete Material
const deleteMaterial = catchAsync(async (req, res) => {
    const { materialId } = req.params;

    const result = await MaterialServices.deleteMaterial(materialId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Material deleted successfully",
        data: result,
    });
});

// Add Variant
const addVariant = catchAsync(async (req, res) => {
    const { materialId } = req.params;

    const result = await MaterialServices.addVariant(materialId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Variant added successfully",
        data: result,
    });
});

// Update Variant
const updateVariant = catchAsync(async (req, res) => {
    const { materialId, variantIndex } = req.params;

    const result = await MaterialServices.updateVariant(
        materialId,
        Number(variantIndex),
        req.body
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Variant updated successfully",
        data: result,
    });
});

// Remove Variant
const removeVariant = catchAsync(async (req, res) => {
    const { materialId, variantIndex } = req.params;

    const result = await MaterialServices.removeVariant(
        materialId,
        Number(variantIndex)
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Variant removed successfully",
        data: result,
    });
});

export const MaterialControllers = {
    addMaterial,
    getAllMaterials,
    getSingleMaterial,
    updateMaterial,
    deleteMaterial,
    addVariant,
    updateVariant,
    removeVariant,
};