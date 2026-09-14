import express from "express";
import { HeroControllers } from "./hero.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

// Public route
router.get("/active", HeroControllers.getActiveHeroes);

// Admin routes
router.post(
    "/add",
    auth(UserRole.admin),
    multerUpload.single("file"),
    HeroControllers.addHero
);

router.get("/", auth(UserRole.admin), HeroControllers.getAllHeroesAdmin);

router.patch(
    "/reorder",
    auth(UserRole.admin),
    HeroControllers.reorderHeroes
);

router.get("/:heroId", auth(UserRole.admin), HeroControllers.getSingleHero);

router.patch(
    "/update/:heroId",
    auth(UserRole.admin),
    multerUpload.single("file"),
    HeroControllers.updateHero
);

router.delete(
    "/delete/:heroId",
    auth(UserRole.admin),
    HeroControllers.deleteHero
);

export const HeroRoutes = router;