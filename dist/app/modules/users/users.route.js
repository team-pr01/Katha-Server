"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const users_controller_1 = require("./users.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const multer_config_1 = require("../../config/multer.config");
const router = express_1.default.Router();
router.get("/", (0, auth_1.default)(auth_constants_1.UserRole.admin), users_controller_1.UserControllers.getAllUsers);
router.get("/me", (0, auth_1.default)(auth_constants_1.UserRole.user, auth_constants_1.UserRole.admin), users_controller_1.UserControllers.getMe);
router.patch("/suspend/:userId", (0, auth_1.default)(auth_constants_1.UserRole.admin), users_controller_1.UserControllers.suspendUser);
router.patch("/suspension/withdraw/:userId", (0, auth_1.default)(auth_constants_1.UserRole.admin), users_controller_1.UserControllers.withdrawSuspension);
router.get("/:userId", (0, auth_1.default)(auth_constants_1.UserRole.admin), users_controller_1.UserControllers.getSingleUserById);
router.patch("/update-profile", (0, auth_1.default)(auth_constants_1.UserRole.user, auth_constants_1.UserRole.admin, auth_constants_1.UserRole.user), multer_config_1.multerUpload.single("file"), users_controller_1.UserControllers.updateProfile);
router.patch("/save-push-token", (0, auth_1.default)(auth_constants_1.UserRole.user, auth_constants_1.UserRole.admin), users_controller_1.UserControllers.savePushToken);
router.patch("/delete-account", (0, auth_1.default)(auth_constants_1.UserRole.user, auth_constants_1.UserRole.user), users_controller_1.UserControllers.deleteAccount);
// For admin and moderator only
router.patch("/account/restore/:userId", (0, auth_1.default)(auth_constants_1.UserRole.admin), users_controller_1.UserControllers.restoreUsersDeletedAccount);
// For admin and moderator only
router.patch("/assign-page", (0, auth_1.default)(auth_constants_1.UserRole.admin), users_controller_1.UserControllers.assignPagesToUser);
exports.UserRoutes = router;
