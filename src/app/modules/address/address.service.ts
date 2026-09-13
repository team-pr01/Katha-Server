/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Address from "./address.model";
import { TAddress, TAddressFilters } from "./address.interface";
import AppError from "../../errors/AppError";

// Add Address (one per user)
const addAddress = async (userId: string, payload: Partial<TAddress>) => {
    // Check if user already has an address
    const existingAddress = await Address.findOne({ userId });

    if (existingAddress) {
        throw new AppError(
            httpStatus.CONFLICT,
            "You already have an address. Please update it instead."
        );
    }

    const address = await Address.create({
        ...payload,
        userId,
    });

    return address;
};

// Get My Address
const getMyAddress = async (userId: string) => {
    const address = await Address.findOne({ userId });

    if (!address) {
        throw new AppError(httpStatus.NOT_FOUND, "No address found");
    }

    return address;
};

// Update Address
const updateAddress = async (userId: string, payload: Partial<TAddress>) => {
    const address = await Address.findOne({ userId });

    if (!address) {
        throw new AppError(httpStatus.NOT_FOUND, "No address found to update");
    }

    const updatedAddress = await Address.findOneAndUpdate(
        { userId },
        payload,
        { new: true, runValidators: true }
    );

    return updatedAddress;
};

// Delete Address
const deleteAddress = async (userId: string) => {
    const address = await Address.findOne({ userId });

    if (!address) {
        throw new AppError(httpStatus.NOT_FOUND, "No address found to delete");
    }

    await Address.findOneAndDelete({ userId });

    return true;
};

// Get All Addresses (Admin)
const getAllAddresses = async (
    filters: TAddressFilters = {},
    skip = 0,
    limit = 10
) => {
    const query: any = {};

    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: "i" } },
            { email: { $regex: filters.search, $options: "i" } },
            { phoneNumber: { $regex: filters.search, $options: "i" } },
            { addressLine1: { $regex: filters.search, $options: "i" } },
        ];
    }

    if (filters.city) {
        query.city = { $regex: filters.city, $options: "i" };
    }

    if (filters.state) {
        query.state = { $regex: filters.state, $options: "i" };
    }

    if (filters.pinCode) {
        query.pinCode = filters.pinCode;
    }

    if (filters.addressType) {
        query.addressType = filters.addressType;
    }

    const total = await Address.countDocuments(query);

    const addresses = await Address.find(query)
        .populate("userId", "name email phoneNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        data: addresses,
        meta: {
            total,
            filteredTotal: total,
            skip,
            limit,
            totalPages: Math.ceil(total / limit),
            currentPage: Math.floor(skip / limit) + 1,
            hasMore: skip + limit < total,
        },
    };
};

export const AddressServices = {
    addAddress,
    getMyAddress,
    updateAddress,
    deleteAddress,
    getAllAddresses,
};