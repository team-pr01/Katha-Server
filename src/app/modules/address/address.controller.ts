import httpStatus from "http-status";
import { AddressServices } from "./address.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// Add Address
const addAddress = catchAsync(async (req, res) => {
    const result = await AddressServices.addAddress(req.user.userId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Address added successfully",
        data: result,
    });
});

// Get My Address
const getMyAddress = catchAsync(async (req, res) => {
    const result = await AddressServices.getMyAddress(req.user.userId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Address fetched successfully",
        data: result,
    });
});

// Update Address
const updateAddress = catchAsync(async (req, res) => {
    const result = await AddressServices.updateAddress(req.user.userId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Address updated successfully",
        data: result,
    });
});

// Delete Address
const deleteAddress = catchAsync(async (req, res) => {
    const result = await AddressServices.deleteAddress(req.user.userId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Address deleted successfully",
        data: result,
    });
});

// Get All Addresses (Admin)
const getAllAddresses = catchAsync(async (req, res) => {
    const {
        search,
        city,
        state,
        pinCode,
        addressType,
        skip = "0",
        limit = "10",
    } = req.query;

    const filters = {
        search: search as string,
        city: city as string,
        state: state as string,
        pinCode: pinCode as string,
        addressType: addressType as string,
    };

    const result = await AddressServices.getAllAddresses(
        filters,
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Addresses fetched successfully",
        data: result,
    });
});

export const AddressControllers = {
    addAddress,
    getMyAddress,
    updateAddress,
    deleteAddress,
    getAllAddresses,
};