import express from "express";
import { UserControllers } from "./users.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.admin, UserRole.moderator),
  UserControllers.getAllUsers
);
router.get(
  "/me",
  auth(
    UserRole.user,
    UserRole.admin,
    UserRole.moderator,
  ),
  UserControllers.getMe
);

router.patch(
  "/suspend/:userId",
  auth(UserRole.admin, UserRole.moderator),
  UserControllers.suspendUser
);
router.patch(
  "/suspension/withdraw/:userId",
  auth(UserRole.admin, UserRole.moderator),
  UserControllers.withdrawSuspension
);
router.get(
  "/:userId",
  auth(UserRole.admin, UserRole.moderator),
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
  auth(UserRole.user, UserRole.admin, UserRole.moderator),
  UserControllers.savePushToken
);

router.patch(
  "/delete-account",
  auth(UserRole.user, UserRole.moderator, UserRole.user),
  UserControllers.deleteAccount
);

// For admin and moderator only
router.patch(
  "/account/restore/:userId",
  auth(UserRole.admin, UserRole.moderator),
  UserControllers.restoreUsersDeletedAccount
);

// For admin and moderator only
router.patch(
  "/assign-page",
  auth(UserRole.admin, UserRole.moderator),
  UserControllers.assignPagesToUser
);

export const UserRoutes = router;
