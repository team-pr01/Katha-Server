/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import PersonalizedOrder from "./personalizedOrder.model";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import AppError from "../../errors/AppError";
import { TPersonalizedOrderFilters } from "./personalizedOrders.interface";
import { deleteImageFromCloudinary } from "../../utils/deleteImageFromCloudinary";

// Helper to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url: string): string | null => {
    const publicId = url.split("/").pop()?.split(".")[0];
    return publicId || null;
};

// Submit Personalized Order
const submitPersonalizedOrder = async (
    userId: string,
    payload: any,
    files: Express.Multer.File[]
) => {
    // Upload reference images
    let referenceImageUrls: string[] = [];
    if (files && files.length > 0) {
        referenceImageUrls = await Promise.all(
            files.map(async (file, index) => {
                const { secure_url } = await sendImageToCloudinary(
                    `personalized-order-${Date.now()}-${index}`,
                    file.path
                );
                return secure_url;
            })
        );
    }

    const orderData = {
        ...payload,
        referenceImages: referenceImageUrls,
        userId : userId || null,
        orderStatus: "pending",
    };

    const order = await PersonalizedOrder.create(orderData);

    return order;
};

// Get All Personalized Orders (Admin)
const getAllPersonalizedOrders = async (
    filters: TPersonalizedOrderFilters = {},
    skip = 0,
    limit = 10
) => {
    const query: any = {};

    // Search by customer name, email, phone, occasion, recipient name
    if (filters.keyword) {
        query.$or = [
            { fullName: { $regex: filters.keyword, $options: "i" } },
            { email: { $regex: filters.keyword, $options: "i" } },
            { phoneNumber: { $regex: filters.keyword, $options: "i" } },
            { recipientFulName: { $regex: filters.keyword, $options: "i" } },
            { occasion: { $regex: filters.keyword, $options: "i" } },
        ];
    }

    if (filters.orderStatus) {
        query.orderStatus = filters.orderStatus;
    }

    if (filters.occasion) {
        query.occasion = { $regex: filters.occasion, $options: "i" };
    }

    if (filters.ageGroup) {
        query.ageGroup = filters.ageGroup;
    }

    if (filters.budgetRange) {
        query.budgetRange = filters.budgetRange;
    }

    if (filters.city) {
        query.city = { $regex: filters.city, $options: "i" };
    }

    if (filters.state) {
        query.state = { $regex: filters.state, $options: "i" };
    }

    if (filters.userId) {
        query.userId = filters.userId;
    }

    if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = filters.startDate;
        if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const total = await PersonalizedOrder.countDocuments(query);

    const orders = await PersonalizedOrder.find(query)
        .populate("userId", "name email phoneNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        data: orders,
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

// Get Single Personalized Order by ID
const getSinglePersonalizedOrderById = async (orderId: string) => {
    const order = await PersonalizedOrder.findById(orderId)
        .populate("userId", "name email phoneNumber")
        .lean();

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Personalized order not found");
    }

    return order;
};

// Get My Personalized Orders (User)
const getMyPersonalizedOrders = async (
    userId: string,
    skip = 0,
    limit = 10
) => {
    const query = { userId };

    const total = await PersonalizedOrder.countDocuments(query);

    const orders = await PersonalizedOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        data: orders,
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

// Update Order Status
const updateOrder = async (orderId: string, payload: any) => {
    const order = await PersonalizedOrder.findById(orderId);

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Personalized order not found");
    }

    if (!payload || Object.keys(payload).length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "No fields to update");
    }

    const updatedOrder = await PersonalizedOrder.findByIdAndUpdate(
        orderId,
        payload,
        { new: true }
    );

    return updatedOrder;
};

interface IUpdateOrderStatusPayload {
  orderStatus?:
    | "Pending"
    | "Confirmed"
    | "Packed"
    | "Shipped"
    | "Delivered"
    | "Cancelled"
    | "Returned";
  paymentStatus?: "Pending" | "Paid" | "Failed" | "Refunded";
}

// Map order status to the corresponding timestamp field
const orderStatusTimestampMap: Record<string, string> = {
  confirmed: "confirmedAt",
  packed: "packedAt",
  shipped: "shippedAt",
  delivered: "deliveredAt",
  cancelled: "cancelledAt",
  returned: "returnedAt",
};

const paymentStatusTimestampMap: Record<string, string> = {
  paid: "paidAt",
};

const updateOrderStatus = async (
  orderId: string,
  payload: IUpdateOrderStatusPayload
) => {
  const order = await PersonalizedOrder.findById(orderId);

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Personalized order not found");
  }

  if (!payload || Object.keys(payload).length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "No fields to update");
  }

  if (!payload.orderStatus && !payload.paymentStatus) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide orderStatus or paymentStatus to update"
    );
  }

  const updateData: Record<string, any> = {};

  const orderObj = order.toObject() as Record<string, any>;

  // Handle order status update
  if (payload.orderStatus) {
    updateData.orderStatus = payload.orderStatus;

    const timestampField = orderStatusTimestampMap[payload.orderStatus];
    console.log("Order status timestamp field:", timestampField);
    console.log("Existing value:", orderObj[timestampField]);

    if (timestampField && !orderObj[timestampField]) {
      updateData[timestampField] = new Date();
    }
  }

  // Handle payment status update
  if (payload.paymentStatus) {
    updateData.paymentStatus = payload.paymentStatus;

    const timestampField = paymentStatusTimestampMap[payload.paymentStatus];
    console.log("Payment status timestamp field:", timestampField);
    console.log("Existing value:", orderObj[timestampField]);

    if (timestampField && !orderObj[timestampField]) {
      updateData[timestampField] = new Date();
    }
  }

  const updatedOrder = await PersonalizedOrder.findByIdAndUpdate(
    orderId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return updatedOrder;
};

// Delete Personalized Order (Delete reference images too)
const deletePersonalizedOrder = async (orderId: string) => {
    const order = await PersonalizedOrder.findById(orderId);

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Personalized order not found");
    }

    // Delete reference images from Cloudinary
    if (order.referenceImages && order.referenceImages.length > 0) {
        await Promise.all(
            order.referenceImages.map(async (url: string) => {
                const publicId = getPublicIdFromUrl(url);
                if (publicId) {
                    await deleteImageFromCloudinary(publicId);
                }
            })
        );
    }

    await PersonalizedOrder.findByIdAndDelete(orderId);

    return true;
};

export const PersonalizedOrderServices = {
    submitPersonalizedOrder,
    getAllPersonalizedOrders,
    getSinglePersonalizedOrderById,
    getMyPersonalizedOrders,
    updateOrder,
    updateOrderStatus,
    deletePersonalizedOrder,
};