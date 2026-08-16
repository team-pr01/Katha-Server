import express from "express";
import { ProductControllers } from "./product.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

// Product CRUD Operations
router.post(
  "/add",
  auth(UserRole.admin),
  multerUpload.array("files", 6),
  ProductControllers.addProduct
);

router.get(
  "/",
  ProductControllers.getAllProducts
);

router.get(
  "/:productId",
  ProductControllers.getSingleProductById
);

router.patch(
  "/update/:productId",
  auth(UserRole.admin),
  multerUpload.array("files", 6),
  ProductControllers.updateProduct
);

router.delete(
  "/delete/:productId",
  auth(UserRole.admin),
  ProductControllers.deleteProduct
);

// Review Routes
router.post(
  "/:productId/reviews",
  auth(UserRole.user),
  multerUpload.array("images", 4),
  ProductControllers.addReview
);

router.get(
  "/:productId/reviews",
  ProductControllers.getProductReviews
);

export const ProductRoutes = router;