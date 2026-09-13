import express from "express";
import { UserControllers } from "./users.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

router.get(
  "/stats",
  auth(UserRole.user),
  UserControllers.getUserStats
);

router.get(
  "/",
  auth(UserRole.admin),
  UserControllers.getAllUsers
);
router.get(
  "/me",
  auth(
    UserRole.user,
    UserRole.admin,
  ),
  UserControllers.getMe
);

router.patch(
  "/suspend/:userId",
  auth(UserRole.admin),
  UserControllers.suspendUser
);
router.patch(
  "/suspension/withdraw/:userId",
  auth(UserRole.admin),
  UserControllers.withdrawSuspension
);
router.get(
  "/:userId",
  auth(UserRole.admin),
  UserControllers.getSingleUserById
);

router.patch(
  "/update-profile",
  auth(
    UserRole.user,
    UserRole.admin,
    UserRole.user,
  ),
  multerUpload.single("file"),
  UserControllers.updateProfile
);

router.patch(
  "/save-push-token",
  auth(UserRole.user, UserRole.admin),
  UserControllers.savePushToken
);

router.patch(
  "/delete-account",
  auth(UserRole.user, UserRole.user),
  UserControllers.deleteAccount
);

// For admin and moderator only
router.patch(
  "/account/restore/:userId",
  auth(UserRole.admin),
  UserControllers.restoreUsersDeletedAccount
);

export const UserRoutes = router;
