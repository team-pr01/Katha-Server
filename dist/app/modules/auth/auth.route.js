"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoute = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_validation_1 = require("./auth.validation");
const auth_controller_1 = require("./auth.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("./auth.constants");
// import { upload } from "../../utils/sendImageToCloudinary";
const router = express_1.default.Router();
router.post("/signup", auth_controller_1.AuthControllers.signup);
router.post("/login", (0, validateRequest_1.default)(auth_validation_1.AuthValidations.LoginValidationSchema), auth_controller_1.AuthControllers.loginUser);
router.post("/forgot-password", auth_controller_1.AuthControllers.forgetPassword);
router.post("/verify-forgot-password-otp", auth_controller_1.AuthControllers.verifyForgotPasswordOtp);
router.post("/resend-forgot-password-otp", auth_controller_1.AuthControllers.resendForgotPasswordOtp);
router.post("/reset-password", auth_controller_1.AuthControllers.resetPassword);
router.post("/change-password", (0, auth_1.default)(auth_constants_1.UserRole.admin, auth_constants_1.UserRole.user), auth_controller_1.AuthControllers.changePassword);
// router.post("/verify-otp", AuthControllers.verifyOtp);
// router.post("/resend-otp", AuthControllers.resendOtp);
router.post("/refresh-token", (0, validateRequest_1.default)(auth_validation_1.AuthValidations.refreshTokenValidationSchema), auth_controller_1.AuthControllers.refreshToken);
// router.post("/verify-reset-password-otp", AuthControllers.verifyResetOtp);
// router.post("/resend-forgot-password-otp", AuthControllers.resendForgotPasswordOtp);
// router.post(
//   "/change-password",
//   auth(UserRole.admin, UserRole.user, UserRole.tutor, UserRole.guardian, UserRole.staff),
//   AuthControllers.changePassword
// );
exports.AuthRoute = router;
