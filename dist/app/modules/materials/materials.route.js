"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const materials_controller_1 = require("./materials.controller");
const auth_constants_1 = require("../auth/auth.constants");
const router = express_1.default.Router();
// Admin routes
router.post("/add", (0, auth_1.default)(auth_constants_1.UserRole.admin), materials_controller_1.MaterialControllers.addMaterial);
router.patch("/update/:materialId", (0, auth_1.default)(auth_constants_1.UserRole.admin), materials_controller_1.MaterialControllers.updateMaterial);
router.delete("/delete/:materialId", (0, auth_1.default)(auth_constants_1.UserRole.admin), materials_controller_1.MaterialControllers.deleteMaterial);
// Variant routes
router.post("/:materialId/variants", (0, auth_1.default)(auth_constants_1.UserRole.admin), materials_controller_1.MaterialControllers.addVariant);
router.patch("/:materialId/variants/:variantIndex", (0, auth_1.default)(auth_constants_1.UserRole.admin), materials_controller_1.MaterialControllers.updateVariant);
router.delete("/:materialId/variants/:variantIndex", (0, auth_1.default)(auth_constants_1.UserRole.admin), materials_controller_1.MaterialControllers.removeVariant);
router.get("/", materials_controller_1.MaterialControllers.getAllMaterials);
router.get("/:materialId", (0, auth_1.default)(auth_constants_1.UserRole.admin), materials_controller_1.MaterialControllers.getSingleMaterial);
exports.MaterialRoutes = router;
