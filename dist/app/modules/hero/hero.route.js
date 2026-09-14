"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroRoutes = void 0;
const express_1 = __importDefault(require("express"));
const hero_controller_1 = require("./hero.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const multer_config_1 = require("../../config/multer.config");
const router = express_1.default.Router();
// Public route
router.get("/active", hero_controller_1.HeroControllers.getActiveHeroes);
// Admin routes
router.post("/add", (0, auth_1.default)(auth_constants_1.UserRole.admin), multer_config_1.multerUpload.single("file"), hero_controller_1.HeroControllers.addHero);
router.get("/", (0, auth_1.default)(auth_constants_1.UserRole.admin), hero_controller_1.HeroControllers.getAllHeroesAdmin);
router.patch("/reorder", (0, auth_1.default)(auth_constants_1.UserRole.admin), hero_controller_1.HeroControllers.reorderHeroes);
router.get("/:heroId", (0, auth_1.default)(auth_constants_1.UserRole.admin), hero_controller_1.HeroControllers.getSingleHero);
router.patch("/update/:heroId", (0, auth_1.default)(auth_constants_1.UserRole.admin), multer_config_1.multerUpload.single("file"), hero_controller_1.HeroControllers.updateHero);
router.delete("/delete/:heroId", (0, auth_1.default)(auth_constants_1.UserRole.admin), hero_controller_1.HeroControllers.deleteHero);
exports.HeroRoutes = router;
