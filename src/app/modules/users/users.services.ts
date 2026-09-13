/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { User } from "../auth/auth.model";
import { infinitePaginate } from "../../utils/infinitePaginate";
import { deleteImageFromCloudinary, extractPublicId } from "../../utils/deleteImageFromCloudinary";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import Order from "../order/order.model";
import Address from "../address/address.model";
// import AppError from "../../errors/AppError";
// import httpStatus from "http-status";
// import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
// import mongoose from "mongoose";
// import { calculateProfileSections } from "../../utils/calculateTutorProfileSections";

const getAllUsers = async (
  filters: any = {},
  skip = 0,
  limit = 10
) => {
  const query: any = {};

  if (filters.keyword) {
    query.$or = [
      { email: { $regex: filters.keyword, $options: 'i' } },
    ];
  }

  /* TEXT SEARCH */
  if (filters.keyword) {
    query.$text = {
      $search: filters.keyword,
    };
  }

  /* FILTERS */
  if (filters.role) query.role = filters.role;
  if (filters.country) query.country = filters.country;
  if (filters.state) query.state = filters.state;
  if (filters.city) query.city = filters.city;
  if (filters.area) query.area = filters.area;

  /* STATUS LOGIC */
  if (filters.status && filters.status !== "all") {
    query.isSuspended = filters.status === "true";
  }

  if (filters.premiumUnlocked && filters.premiumUnlocked !== "all") {
    query.premiumUnlocked = filters.premiumUnlocked === "true";
  }

  return infinitePaginate(User, query, skip, limit);
};

const getSingleUserById = async (userId: string) => {
  const result = await User.findById(userId);
  return result;
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await User.findById(userId);

  return result;
};

// Suspend user - actual operation on User model
const suspendUser = async (userId: string, payload: any) => {
  const user = await User.findByIdAndUpdate(userId, { isSuspended: true, suspensionReason: payload.suspensionReason });
  if (!user) throw new Error("User not found");

  return {};
};

const updateProfile = async (
  userId: string,
  payload: any,
  file?: Express.Multer.File
) => {

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let profilePicture = user.profilePicture;

  /* HANDLE IMAGE UPDATE */

  if (file) {

    /* DELETE OLD IMAGE */
    if (user.profilePicture) {
      const publicId = extractPublicId(user.profilePicture);
      await deleteImageFromCloudinary(publicId);
    }

    /* UPLOAD NEW IMAGE */

    const { secure_url } = await sendImageToCloudinary(
      `profile-${Date.now()}`,
      file.path
    );

    profilePicture = secure_url;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      ...payload,
      profilePicture,
    },
    { new: true }
  );

  return updatedUser;
};

// Activate user back
const withdrawSuspension = async (userId: string) => {
  const user = await User.findByIdAndUpdate(userId, { isSuspended: false, suspensionReason: null });
  if (!user) throw new Error("User not found");

  return {};
};

// Activate user back
const deleteAccount = async (userId: string, payload: any) => {
  const user = await User.findByIdAndUpdate(userId, { isDeleted: true, accountDeleteReason: payload.accountDeleteReason });
  if (!user) throw new Error("User not found");

  return user;
};

// Activate user back
const restoreUsersDeletedAccount = async (userId: string) => {
  const user = await User.findByIdAndUpdate(userId, { isDeleted: false, accountDeleteReason: null });
  if (!user) throw new Error("User not found");

  return user;
};

// Change user role (For admin)
const saveUserPushToken = async (payload: any) => {
  const user = await User.findById(payload?.userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await User.findByIdAndUpdate(
    payload.userId,
    { expoPushToken: payload.expoPushToken },
    {
      new: true,
      runValidators: true,
    }
  );

  return result;
};

// Get User Stats
const getUserStats = async (userId: string) => {
  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Fetch all counts in parallel
  const [
    totalOrders,
    shippedOrders,
    deliveredOrders,
    processingOrders,
    recentOrders,
    address,
  ] = await Promise.all([
    Order.countDocuments({ userId }),
    Order.countDocuments({ userId, orderStatus: "shipped" }),
    Order.countDocuments({ userId, orderStatus: "delivered" }),
    Order.countDocuments({ userId, orderStatus: "pending" }),
    Order.find({ userId })
      .populate("orderedItems.productId", "name slug variants")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
    Address.findOne({ userId }).lean(),
  ]);

  // Enrich recent orders with variant details
  const enrichedRecentOrders = recentOrders.map((order: any) => {
    const enrichedItems = order.orderedItems.map((item: any) => {
      const product = item.productId;
      let variant = null;

      if (product && product.variants && item.variantId) {
        variant = product.variants.find(
          (v: any) => v._id.toString() === item.variantId.toString()
        );
      }

      return {
        ...item,
        variant: variant
          ? {
            _id: variant._id,
            name: variant.name,
            images: variant.images || [],
            size: variant.size,
            color: variant.color,
          }
          : null,
        productId: product
          ? {
            _id: product._id,
            name: product.name,
            slug: product.slug,
          }
          : item.productId,
      };
    });

    return {
      _id: order._id,
      orderId: order.orderId,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      itemCount: order.orderedItems.length,
      orderedItems: enrichedItems,
      createdAt: order.createdAt,
    };
  });

  // Build user profile
  const userProfile = {
    _id: user._id,
    name: user.name,
    email: user.email || null,
    phoneNumber: user.phoneNumber,
    profilePicture: user.profilePicture || null,
    memberSince: user.createdAt,
  };

  // Build order stats
  const orderStats = {
    totalOrders,
    shipped: shippedOrders,
    delivered: deliveredOrders,
    processing: processingOrders,
  };

  return {
    user: userProfile,
    stats: orderStats,
    recentOrders: enrichedRecentOrders,
    deliveryAddress: address || null,
  };
};

export const UserServices = {
  getAllUsers,
  getMe,
  suspendUser,
  withdrawSuspension,
  getSingleUserById,
  updateProfile,
  deleteAccount,
  restoreUsersDeletedAccount,
  saveUserPushToken,
  getUserStats
};
