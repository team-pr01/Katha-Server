import express from "express";
import { AddressControllers } from "./address.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";

const router = express.Router();

// User routes
router.post("/add", auth(UserRole.user, UserRole.admin), AddressControllers.addAddress);
router.get("/my", auth(UserRole.user), AddressControllers.getMyAddress);
router.patch("/update", auth(UserRole.user), AddressControllers.updateAddress);
router.delete("/delete", auth(UserRole.user), AddressControllers.deleteAddress);

// Admin routes
router.get("/", auth(UserRole.admin), AddressControllers.getAllAddresses);

export const AddressRoutes = router;