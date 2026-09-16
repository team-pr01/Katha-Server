import express from "express";
import { ProductVariantControllers } from "./productVariant.controller";
import auth from "../../../middlewares/auth";
import { UserRole } from "../../auth/auth.constants";
import { multerUpload } from "../../../config/multer.config";

const router = express.Router({ mergeParams: true });

// Public routes
router.get("/product/:productId", ProductVariantControllers.getAllVariantsOfAProduct);
router.get("/product/:variantId", ProductVariantControllers.getSingleVariantOfAProduct);

// Admin routes
router.post(
    "/add/:productId",
    auth(UserRole.admin),
    multerUpload.array("files", 10),
    ProductVariantControllers.addVariant
);

router.patch(
    "/update/:productId/:variantId",
    auth(UserRole.admin),
    multerUpload.array("files", 10),
    ProductVariantControllers.updateVariant
);

router.delete(
    "/delete/:productId/:variantId",
    auth(UserRole.admin),
    ProductVariantControllers.deleteVariant
);

export const ProductVariantRoutes = router;