import express from "express";
import auth from "../../middlewares/auth";
import { MaterialControllers } from "./materials.controller";
import { UserRole } from "../auth/auth.constants";

const router = express.Router();

// Admin routes
router.post("/add", auth(UserRole.admin), MaterialControllers.addMaterial);
router.patch("/update/:materialId", auth(UserRole.admin), MaterialControllers.updateMaterial);
router.delete("/delete/:materialId", auth(UserRole.admin), MaterialControllers.deleteMaterial);

// Variant routes
router.post("/:materialId/variants", auth(UserRole.admin), MaterialControllers.addVariant);
router.patch(
    "/:materialId/variants/:variantIndex",
    auth(UserRole.admin),
    MaterialControllers.updateVariant
);
router.delete(
    "/:materialId/variants/:variantIndex",
    auth(UserRole.admin),
    MaterialControllers.removeVariant
);

router.get("/", auth(UserRole.admin), MaterialControllers.getAllMaterials);
router.get("/:materialId", auth(UserRole.admin), MaterialControllers.getSingleMaterial);

export const MaterialRoutes = router;