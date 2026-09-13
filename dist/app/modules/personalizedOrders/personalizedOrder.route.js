"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalizedOrderRoutes = void 0;
const express_1 = __importDefault(require("express"));
const personalizedOrder_controller_1 = require("./personalizedOrder.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const multer_config_1 = require("../../config/multer.config");
const router = express_1.default.Router();
// User routes
router.post("/submit", multer_config_1.multerUpload.array("referenceImages", 5), personalizedOrder_controller_1.PersonalizedOrderControllers.submitPersonalizedOrder);
router.get("/my-orders", (0, auth_1.default)(auth_constants_1.UserRole.user), personalizedOrder_controller_1.PersonalizedOrderControllers.getMyPersonalizedOrders);
// Admin routes
router.get("/", (0, auth_1.default)(auth_constants_1.UserRole.admin), personalizedOrder_controller_1.PersonalizedOrderControllers.getAllPersonalizedOrders);
router.get("/:orderId", (0, auth_1.default)(auth_constants_1.UserRole.admin), personalizedOrder_controller_1.PersonalizedOrderControllers.getSinglePersonalizedOrderById);
router.patch("/update/:orderId", (0, auth_1.default)(auth_constants_1.UserRole.admin), personalizedOrder_controller_1.PersonalizedOrderControllers.updateOrder);
router.patch("/update-status/:orderId", (0, auth_1.default)(auth_constants_1.UserRole.admin), personalizedOrder_controller_1.PersonalizedOrderControllers.updateOrderStatus);
router.delete("/delete/:orderId", (0, auth_1.default)(auth_constants_1.UserRole.admin), personalizedOrder_controller_1.PersonalizedOrderControllers.deletePersonalizedOrder);
exports.PersonalizedOrderRoutes = router;
