import express from "express";
import { PersonalizedOrderControllers } from "./personalizedOrder.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

// User routes
router.post(
    "/submit",
    multerUpload.array("referenceImages", 5),
    PersonalizedOrderControllers.submitPersonalizedOrder
);

router.get(
    "/my-orders",
    auth(UserRole.user),
    PersonalizedOrderControllers.getMyPersonalizedOrders
);

// Admin routes
router.get(
    "/",
    auth(UserRole.admin),
    PersonalizedOrderControllers.getAllPersonalizedOrders
);

router.get(
    "/:orderId",
    auth(UserRole.admin),
    PersonalizedOrderControllers.getSinglePersonalizedOrderById
);

router.patch(
    "/update/:orderId",
    auth(UserRole.admin),
    PersonalizedOrderControllers.updateOrder
);

router.delete(
    "/delete/:orderId",
    auth(UserRole.admin),
    PersonalizedOrderControllers.deletePersonalizedOrder
);

export const PersonalizedOrderRoutes = router;