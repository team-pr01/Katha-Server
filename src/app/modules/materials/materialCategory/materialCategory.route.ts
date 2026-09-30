import express from "express";
import { MaterialCategoryControllers } from "./materialCategory.controller";
import auth from "../../../middlewares/auth";
import { UserRole } from "../../auth/auth.constants";

const router = express.Router();

// Public routes
router.get("/", MaterialCategoryControllers.getAllMaterialCategories);
router.get("/:id", MaterialCategoryControllers.getSingleMaterialCategory);

// Admin routes
router.post(
    "/add",
    auth(UserRole.admin),
    MaterialCategoryControllers.addMaterialCategory
);
router.patch(
    "/update/:id",
    auth(UserRole.admin),
    MaterialCategoryControllers.updateMaterialCategory
);
router.delete(
    "/delete/:id",
    auth(UserRole.admin),
    MaterialCategoryControllers.deleteMaterialCategory
);

export const MaterialCategoryRoutes = router;