"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OccasionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const occasion_controller_1 = require("./occasion.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const multer_config_1 = require("../../config/multer.config");
const router = express_1.default.Router();
// Admin routes
router.post("/add", (0, auth_1.default)(auth_constants_1.UserRole.admin), multer_config_1.multerUpload.single("file"), occasion_controller_1.OccasionControllers.addOccasion);
router.patch("/update/:occasionId", (0, auth_1.default)(auth_constants_1.UserRole.admin), multer_config_1.multerUpload.single("file"), occasion_controller_1.OccasionControllers.updateOccasion);
router.delete("/delete/:occasionId", (0, auth_1.default)(auth_constants_1.UserRole.admin), occasion_controller_1.OccasionControllers.deleteOccasion);
// Sub-occasion routes
router.post("/:occasionId/sub-occasions", (0, auth_1.default)(auth_constants_1.UserRole.admin), multer_config_1.multerUpload.single("file"), occasion_controller_1.OccasionControllers.addSubOccasion);
router.delete("/:occasionId/sub-occasions/:subOccasionId", (0, auth_1.default)(auth_constants_1.UserRole.admin), occasion_controller_1.OccasionControllers.removeSubOccasion);
// Public routes
router.get("/", occasion_controller_1.OccasionControllers.getAllOccasions);
router.get("/:occasionId", occasion_controller_1.OccasionControllers.getSingleOccasion);
exports.OccasionRoutes = router;
