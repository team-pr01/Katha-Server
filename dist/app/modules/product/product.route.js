"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRoutes = void 0;
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("./product.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const multer_config_1 = require("../../config/multer.config");
const router = express_1.default.Router();
// Product CRUD Operations
router.post("/add", (0, auth_1.default)(auth_constants_1.UserRole.admin), multer_config_1.multerUpload.array("files", 10), product_controller_1.ProductControllers.addProduct);
router.get("/", product_controller_1.ProductControllers.getAllProducts);
router.get("/slug/:slug", product_controller_1.ProductControllers.getSingleProductBySlug);
router.get("/:productId", product_controller_1.ProductControllers.getSingleProductById);
router.patch("/update/:productId", (0, auth_1.default)(auth_constants_1.UserRole.admin), multer_config_1.multerUpload.array("files", 6), product_controller_1.ProductControllers.updateProduct);
router.delete("/delete/:productId", (0, auth_1.default)(auth_constants_1.UserRole.admin), product_controller_1.ProductControllers.deleteProduct);
// Review Routes
router.post("/:productId/reviews", (0, auth_1.default)(auth_constants_1.UserRole.user), multer_config_1.multerUpload.array("images", 4), product_controller_1.ProductControllers.addReview);
router.get("/:productId/reviews", product_controller_1.ProductControllers.getProductReviews);
exports.ProductRoutes = router;
