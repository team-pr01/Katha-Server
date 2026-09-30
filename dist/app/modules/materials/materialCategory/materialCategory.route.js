"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialCategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const materialCategory_controller_1 = require("./materialCategory.controller");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const auth_constants_1 = require("../../auth/auth.constants");
const router = express_1.default.Router();
// Public routes
router.get("/", materialCategory_controller_1.MaterialCategoryControllers.getAllMaterialCategories);
router.get("/:id", materialCategory_controller_1.MaterialCategoryControllers.getSingleMaterialCategory);
// Admin routes
router.post("/add", (0, auth_1.default)(auth_constants_1.UserRole.admin), materialCategory_controller_1.MaterialCategoryControllers.addMaterialCategory);
router.patch("/update/:id", (0, auth_1.default)(auth_constants_1.UserRole.admin), materialCategory_controller_1.MaterialCategoryControllers.updateMaterialCategory);
router.delete("/delete/:id", (0, auth_1.default)(auth_constants_1.UserRole.admin), materialCategory_controller_1.MaterialCategoryControllers.deleteMaterialCategory);
exports.MaterialCategoryRoutes = router;
