import httpStatus from "http-status";
import { CouponCodeService } from "./couponCode.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// Add Coupon Code
const addCouponCode = catchAsync(async (req, res) => {
  const result = await CouponCodeService.addCouponCode(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Coupon code added successfully",
    data: result,
  });
});

// Get All Coupon Codes
const getAllCouponCodes = catchAsync(async (req, res) => {
  const { keyword, page = "1", limit = "10" } = req.query;

  const result = await CouponCodeService.getAllCouponCodes(
    keyword as string,
    Number(page),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon codes fetched successfully",
    data: {
      couponCodes: result.data,
      pagination: result.meta,
    },
  });
});

// Delete Coupon Code
const deleteCouponCode = catchAsync(async (req, res) => {
  const { couponCodeId } = req.params;
  const result = await CouponCodeService.deleteCouponCode(couponCodeId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon code deleted successfully",
    data: result,
  });
});

// Validate coupon code
const validateCouponCode = catchAsync(async (req, res) => {
  const { code } = req.body;
  const result = await CouponCodeService.validateCouponCode(code);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon code is valid",
    data: result,
  });
});


export const CouponCodeControllers = {
  addCouponCode,
  getAllCouponCodes,
  deleteCouponCode,
  validateCouponCode
};
