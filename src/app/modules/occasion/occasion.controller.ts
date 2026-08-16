import httpStatus from "http-status";
import { OccasionServices } from "./occasion.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// Add Occasion
const addOccasion = catchAsync(async (req, res) => {
    const file = req.file as Express.Multer.File | undefined;

    const result = await OccasionServices.addOccasion(req.body, file);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Occasion added successfully",
        data: result,
    });
});

// Get All Occasions
const getAllOccasions = catchAsync(async (req, res) => {
    const { search, isActive, skip = "0", limit = "10" } = req.query;

    const filters = {
        search: search as string,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
    };

    const result = await OccasionServices.getAllOccasions(
        filters,
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Occasions fetched successfully",
        data: result,
    });
});

// Get Single Occasion
const getSingleOccasion = catchAsync(async (req, res) => {
    const { occasionId } = req.params;

    const result = await OccasionServices.getSingleOccasion(occasionId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Occasion fetched successfully",
        data: result,
    });
});

// Update Occasion
const updateOccasion = catchAsync(async (req, res) => {
    const { occasionId } = req.params;
    const file = req.file as Express.Multer.File | undefined;
    const { imagesToRemove, ...updateData } = req.body;

    const imagesToRemoveArray = imagesToRemove
        ? typeof imagesToRemove === "string"
            ? JSON.parse(imagesToRemove)
            : imagesToRemove
        : [];

    const result = await OccasionServices.updateOccasion(
        occasionId,
        updateData,
        file,
        imagesToRemoveArray
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Occasion updated successfully",
        data: result,
    });
});

// Delete Occasion
const deleteOccasion = catchAsync(async (req, res) => {
    const { occasionId } = req.params;

    const result = await OccasionServices.deleteOccasion(occasionId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Occasion deleted successfully",
        data: result,
    });
});

// Add Sub-Occasion
const addSubOccasion = catchAsync(async (req, res) => {
    const { occasionId } = req.params;

    const result = await OccasionServices.addSubOccasion(
        occasionId,
        req.body
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Sub-occasion added successfully",
        data: result,
    });
});

// Remove Sub-Occasion
const removeSubOccasion = catchAsync(async (req, res) => {
    const { occasionId, subOccasionId } = req.params;

    const result = await OccasionServices.removeSubOccasion(
        occasionId,
        subOccasionId
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Sub-occasion removed successfully",
        data: result,
    });
});

export const OccasionControllers = {
    addOccasion,
    getAllOccasions,
    getSingleOccasion,
    updateOccasion,
    deleteOccasion,
    addSubOccasion,
    removeSubOccasion,
};