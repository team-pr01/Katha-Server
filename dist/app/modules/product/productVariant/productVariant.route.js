"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductVariantRoutes = void 0;
const express_1 = __importDefault(require("express"));
const productVariant_controller_1 = require("./productVariant.controller");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const auth_constants_1 = require("../../auth/auth.constants");
const multer_config_1 = require("../../../config/multer.config");
const router = express_1.default.Router({ mergeParams: true });
// Public routes
router.get("/product/:productId", productVariant_controller_1.ProductVariantControllers.getAllVariantsOfAProduct);
router.get("/product/single/:variantId", productVariant_controller_1.ProductVariantControllers.getSingleVariantOfAProduct);
// Admin routes
router.post("/add/:productId", (0, auth_1.default)(auth_constants_1.UserRole.admin), multer_config_1.multerUpload.array("files", 10), productVariant_controller_1.ProductVariantControllers.addVariant);
router.patch("/update/:productId/:variantId", (0, auth_1.default)(auth_constants_1.UserRole.admin), multer_config_1.multerUpload.array("files", 10), productVariant_controller_1.ProductVariantControllers.updateVariant);
router.delete("/delete/:productId/:variantId", (0, auth_1.default)(auth_constants_1.UserRole.admin), productVariant_controller_1.ProductVariantControllers.deleteVariant);
exports.ProductVariantRoutes = router;
