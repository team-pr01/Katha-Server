"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderTrackingRoutes = void 0;
const express_1 = __importDefault(require("express"));
const orderTracking_controller_1 = require("./orderTracking.controller");
const router = express_1.default.Router();
// Public route - no auth required
router.post("/", orderTracking_controller_1.OrderTrackingControllers.trackOrder);
exports.OrderTrackingRoutes = router;
