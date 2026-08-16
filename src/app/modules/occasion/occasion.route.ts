import express from "express";
import { OccasionControllers } from "./occasion.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

// Admin routes
router.post(
  "/add",
  auth(UserRole.admin),
  multerUpload.single("file"),
  OccasionControllers.addOccasion
);

router.patch(
  "/update/:occasionId",
  auth(UserRole.admin),
  multerUpload.single("file"),
  OccasionControllers.updateOccasion
);

router.delete(
  "/delete/:occasionId",
  auth(UserRole.admin),
  OccasionControllers.deleteOccasion
);

// Sub-occasion routes
router.post(
  "/:occasionId/sub-occasions",
  auth(UserRole.admin),
  multerUpload.single("file"),
  OccasionControllers.addSubOccasion
);

router.delete(
  "/:occasionId/sub-occasions/:subOccasionId",
  auth(UserRole.admin),
  OccasionControllers.removeSubOccasion
);

// Public routes
router.get(
  "/",
  OccasionControllers.getAllOccasions
);

router.get(
  "/:occasionId",
  OccasionControllers.getSingleOccasion
);

export const OccasionRoutes = router;