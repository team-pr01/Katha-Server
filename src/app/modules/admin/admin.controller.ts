import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { AdminService } from "./admin.service";
import sendResponse from "../../utils/sendResponse";

const getAdminStats = catchAsync(async (req, res) => {
  const stats = await AdminService.getAdminStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin stats retrieved successfully",
    data: stats,
  });
});

// Change User Role (For admin)
const changeUserRole = catchAsync(async (req, res) => {
  const result = await AdminService.changeUserRole(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User role updated successfully.",
    data: result,
  });
});

export const AdminController = {
  getAdminStats,
  changeUserRole,
};