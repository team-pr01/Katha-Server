import { v2 as cloudinary } from "cloudinary";
import AppError from "../errors/AppError";
import httpStatus from "http-status";

export const deleteImageFromCloudinary = async (publicId: string) => {
  try {
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new AppError(httpStatus.BAD_REQUEST, "Failed to delete image from Cloudinary");
  }
};


export const extractPublicId = (url: string): string => {
  if (!url) return "";

  const parts = url.split("/upload/");

  const publicIdWithVersion = parts[1];

  const publicId = publicIdWithVersion
    .replace(/^v\d+\//, "")
    .replace(/\.[^/.]+$/, "");

  return publicId;
};