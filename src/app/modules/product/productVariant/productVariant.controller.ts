import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ProductVariantServices } from "./productVariant.service";

// Add Variant to Product
const addVariant = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const files = (req.files as Express.Multer.File[]) || [];

    const result = await ProductVariantServices.addVariant(
        productId,
        req.body,
        files
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Variant added successfully",
        data: result,
    });
});

// Get All Variants of a Product
const getAllVariantsOfAProduct = catchAsync(async (req, res) => {
    const { productId } = req.params;

    const result = await ProductVariantServices.getAllVariantsOfAProduct(productId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Variants fetched successfully",
        data: result,
    });
});

// Get Single Variant
const getSingleVariantOfAProduct = catchAsync(async (req, res) => {
    const { productId, variantId } = req.params;

    const result = await ProductVariantServices.getSingleVariantOfAProduct(
        productId,
        variantId
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Variant fetched successfully",
        data: result,
    });
});

// Update Variant
const updateVariant = catchAsync(async (req, res) => {
    const { productId, variantId } = req.params;
    const files = (req.files as Express.Multer.File[]) || [];
    const { imagesToRemove, ...updateData } = req.body;

    const imagesToRemoveArray = imagesToRemove
        ? typeof imagesToRemove === "string"
            ? JSON.parse(imagesToRemove)
            : imagesToRemove
        : [];

    const result = await ProductVariantServices.updateVariant(
        productId,
        variantId,
        updateData,
        files,
        imagesToRemoveArray
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Variant updated successfully",
        data: result,
    });
});

// Delete Variant
const deleteVariant = catchAsync(async (req, res) => {
    const { productId, variantId } = req.params;

    const result = await ProductVariantServices.deleteVariant(
        productId,
        variantId
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Variant deleted successfully",
        data: result,
    });
});

export const ProductVariantControllers = {
    addVariant,
    getAllVariantsOfAProduct,
    getSingleVariantOfAProduct,
    updateVariant,
    deleteVariant,
};