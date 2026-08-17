import express from "express";
import { CategoryControllers } from "./categories.controller";
import { UserRole } from "../auth/auth.constants";
import { multerUpload } from "../../config/multer.config";
import auth from "../../middlewares/auth";

const router = express.Router();

// Admin routes
router.post(
  "/add",
  auth(UserRole.admin),
  multerUpload.single("file"),
  CategoryControllers.addCategory
);

router.patch(
  "/update/:categoryId",
  auth(UserRole.admin),
  multerUpload.single("file"),
  CategoryControllers.updateCategory
);

router.delete(
  "/delete/:categoryId",
  auth(UserRole.admin),
  CategoryControllers.deleteCategory
);

// Public routes
router.get(
  "/",
  CategoryControllers.getAllCategories
);

router.get(
  "/area/:areaName",
  CategoryControllers.getCategoriesByAreaName
);

router.get(
  "/:categoryId",
  CategoryControllers.getSingleCategory
);

export const CategoryRoutes = router;