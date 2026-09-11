"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const categories_controller_1 = require("./categories.controller");
const auth_constants_1 = require("../auth/auth.constants");
const multer_config_1 = require("../../config/multer.config");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
// Admin routes
router.post("/add", (0, auth_1.default)(auth_constants_1.UserRole.admin), multer_config_1.multerUpload.single("file"), categories_controller_1.CategoryControllers.addCategory);
router.patch("/update/:categoryId", (0, auth_1.default)(auth_constants_1.UserRole.admin), multer_config_1.multerUpload.single("file"), categories_controller_1.CategoryControllers.updateCategory);
router.delete("/delete/:categoryId", (0, auth_1.default)(auth_constants_1.UserRole.admin), categories_controller_1.CategoryControllers.deleteCategory);
// Public routes
router.get("/", categories_controller_1.CategoryControllers.getAllCategories);
router.get("/area/:areaName", categories_controller_1.CategoryControllers.getCategoriesByAreaName);
router.get("/:categoryId", categories_controller_1.CategoryControllers.getSingleCategory);
exports.CategoryRoutes = router;
