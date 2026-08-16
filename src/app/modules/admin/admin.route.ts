import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";
import { AdminController } from './admin.controller';

const router = express.Router();

router.get("/stats", auth(UserRole.admin, UserRole.moderator), AdminController.getAdminStats);

router.put(
    "/change-role",
    auth(UserRole.admin),
    AdminController.changeUserRole
);

export const AdminRoutes = router;