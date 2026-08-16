import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { AuthValidations } from "./auth.validation";
import { AuthControllers } from "./auth.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "./auth.constants";
// import { upload } from "../../utils/sendImageToCloudinary";
const router = express.Router();

router.post("/signup", AuthControllers.signup);

router.post(
  "/login",
  validateRequest(AuthValidations.LoginValidationSchema),
  AuthControllers.loginUser
);

router.post("/forgot-password", AuthControllers.forgetPassword);

router.post(
  "/verify-forgot-password-otp",
  AuthControllers.verifyForgotPasswordOtp
);

router.post(
  "/resend-forgot-password-otp",
  AuthControllers.resendForgotPasswordOtp
);

router.post(
  "/reset-password",
  AuthControllers.resetPassword
);

router.post(
  "/change-password",
  auth(UserRole.admin, UserRole.user),
  AuthControllers.changePassword
);

// router.post("/verify-otp", AuthControllers.verifyOtp);
// router.post("/resend-otp", AuthControllers.resendOtp);


// router.post(
//   "/refresh-token",
//   validateRequest(AuthValidations.refreshTokenValidationSchema),
//   AuthControllers.refreshToken
// );

// router.post("/verify-reset-password-otp", AuthControllers.verifyResetOtp);
// router.post("/resend-forgot-password-otp", AuthControllers.resendForgotPasswordOtp);



// router.post(
//   "/change-password",
//   auth(UserRole.admin, UserRole.user, UserRole.tutor, UserRole.guardian, UserRole.staff),
//   AuthControllers.changePassword
// );

export const AuthRoute = router;
