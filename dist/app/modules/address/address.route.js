"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressRoutes = void 0;
const express_1 = __importDefault(require("express"));
const address_controller_1 = require("./address.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const router = express_1.default.Router();
// User routes
router.post("/add", (0, auth_1.default)(auth_constants_1.UserRole.user, auth_constants_1.UserRole.admin), address_controller_1.AddressControllers.addAddress);
router.get("/my", (0, auth_1.default)(auth_constants_1.UserRole.user), address_controller_1.AddressControllers.getMyAddress);
router.patch("/update", (0, auth_1.default)(auth_constants_1.UserRole.user), address_controller_1.AddressControllers.updateAddress);
router.delete("/delete", (0, auth_1.default)(auth_constants_1.UserRole.user), address_controller_1.AddressControllers.deleteAddress);
// Admin routes
router.get("/", (0, auth_1.default)(auth_constants_1.UserRole.admin), address_controller_1.AddressControllers.getAllAddresses);
exports.AddressRoutes = router;
