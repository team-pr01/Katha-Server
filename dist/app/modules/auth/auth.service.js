"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../../config"));
const auth_model_1 = require("./auth.model");
const sendEmail_1 = require("../../utils/sendEmail");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_utils_1 = require("./auth.utils");
const generate4DigitsOTP_1 = require("../../utils/generate4DigitsOTP");
// Signup with auto-login (Only 3 fields: name, phoneNumber, password)
const signup = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, phoneNumber, password } = payload;
    // Check if user already exists with this phone number
    const existingUser = yield auth_model_1.User.findOne({ phoneNumber });
    if (existingUser) {
        // Check if user is deleted - reactivate account
        if (existingUser.isDeleted) {
            // Reactivate the account
            existingUser.isDeleted = false;
            existingUser.isSuspended = false;
            existingUser.accountDeleteReason = null;
            existingUser.suspensionReason = null;
            existingUser.lastLoggedIn = new Date();
            // Update password
            existingUser.password = password; // Will be hashed by pre-save hook
            yield existingUser.save();
            // Generate tokens for restored user
            const jwtPayload = {
                userId: existingUser._id.toString(),
                name: existingUser.name,
                phoneNumber: existingUser.phoneNumber,
                email: existingUser.email || "",
                role: existingUser.role,
            };
            const accessToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
            const refreshToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
            return {
                message: "Account restored successfully",
                user: {
                    _id: existingUser._id,
                    name: existingUser.name,
                    phoneNumber: existingUser.phoneNumber,
                    email: existingUser.email,
                    role: existingUser.role,
                    profilePicture: existingUser.profilePicture,
                },
                accessToken,
                refreshToken,
                isNewUser: false,
                isRestored: true,
            };
        }
        // User already exists and is active
        throw new AppError_1.default(http_status_1.default.CONFLICT, "User already exists with this phone number.");
    }
    // Create new user
    const userData = {
        name,
        phoneNumber,
        password,
        role: "user",
        isDeleted: false,
        isSuspended: false,
        lastLoggedIn: new Date(),
    };
    const newUser = yield auth_model_1.User.create(userData);
    // Generate tokens for new user (auto-login)
    const jwtPayload = {
        userId: newUser._id.toString(),
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        email: newUser.email || "",
        role: newUser.role,
    };
    const accessToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    const refreshToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
    return {
        message: "Account created successfully",
        user: {
            _id: newUser._id,
            name: newUser.name,
            phoneNumber: newUser.phoneNumber,
            email: newUser.email,
            role: newUser.role,
            profilePicture: newUser.profilePicture,
        },
        accessToken,
        refreshToken,
        isNewUser: true,
        isRestored: false,
    };
});
// Login using phone number
const loginUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, password } = payload;
    // Check if the user exists
    const user = yield auth_model_1.User.isUserExists(phoneNumber);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Invalid phone number or password.");
    }
    // Check if the user is deleted
    if (user.isDeleted) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Invalid phone number or password.");
    }
    // Check if the user is suspended
    if (user.isSuspended) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your account has been suspended. Please contact support for assistance.");
    }
    // Check if the password is correct
    if (!(yield auth_model_1.User.isPasswordMatched(password, user.password))) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Invalid phone number or password.");
    }
    // Update last login
    yield auth_model_1.User.updateOne({ _id: user._id }, { $set: { lastLoggedIn: new Date() } });
    // Create token
    const jwtPayload = {
        userId: user._id.toString(),
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email || "",
        role: user.role,
    };
    const accessToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    const refreshToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
    return {
        accessToken,
        refreshToken,
        user: {
            _id: user._id,
            name: user.name,
            phoneNumber: user.phoneNumber,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture,
        },
    };
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized to proceed!");
    }
    const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_refresh_secret);
    const { userId } = decoded;
    const user = yield auth_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found!");
    }
    if (user.isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "User account deleted.");
    }
    if (user.isSuspended) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Account suspended.");
    }
    const jwtPayload = {
        userId: user._id.toString(),
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email || "",
        role: user.role,
    };
    const accessToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    return {
        accessToken,
    };
});
const forgetPassword = (phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findOne({ phoneNumber });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    const otp = (0, generate4DigitsOTP_1.generate4DigitsOTP)();
    yield auth_model_1.User.updateOne({ phoneNumber }, {
        resetPasswordOtp: otp,
        resetPasswordOtpExpiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 min
    });
    // If email exists, send OTP via email
    if (user.email) {
        const htmlBody = `
      <p>Hello <strong>${(user === null || user === void 0 ? void 0 : user.name) || "User"}</strong>,</p>
      <p>We received a request to reset your password.</p>
      <p>👉 <strong>Your reset OTP: ${otp}</strong></p>
      <p>Please follow these steps:</p>
      <ol>
        <li>Open the app.</li>
        <li>Go to the <strong>"Reset Password"</strong> screen.</li>
        <li>Paste the above OTP in the token input field.</li>
        <li>Enter your new password.</li>
        <li>Submit the form to complete the reset.</li>
      </ol>
      <p>If you didn't request this, you can ignore this email.</p>
      <p>Thanks,<br/>AKF Team</p>
    `;
        yield (0, sendEmail_1.sendEmail)(user.email, htmlBody, "Reset your password within 2 minutes");
    }
    // TODO: Also send OTP via SMS if SMS service is configured
    return { message: "OTP sent successfully" };
});
const verifyForgotPasswordOtp = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, otp } = payload;
    const user = yield auth_model_1.User.findOne({ phoneNumber });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpiresAt) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid OTP.");
    }
    // Expiry check
    if (new Date(user.resetPasswordOtpExpiresAt) < new Date()) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "OTP expired.");
    }
    // Wrong OTP
    if (user.resetPasswordOtp !== otp) {
        yield auth_model_1.User.updateOne({ phoneNumber }, { $inc: { resetPasswordOtpAttempts: 1 } });
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid OTP.");
    }
    return { message: "OTP verified successfully" };
});
const resendForgotPasswordOtp = (phoneNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findOne({ phoneNumber });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    const otp = (0, generate4DigitsOTP_1.generate4DigitsOTP)();
    yield auth_model_1.User.updateOne({ phoneNumber }, {
        resetPasswordOtp: otp,
        resetPasswordOtpExpiresAt: new Date(Date.now() + 2 * 60 * 1000),
        resetPasswordOtpAttempts: 0,
    });
    // If email exists, send OTP via email
    if (user.email) {
        yield (0, sendEmail_1.sendEmail)(user.email, `<p>Your new OTP: <strong>${otp}</strong></p><p>Valid for 2 minutes.</p>`, "Resend Reset Password OTP");
    }
    return { message: "New OTP sent successfully" };
});
const resetPassword = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, newPassword } = payload;
    const user = yield auth_model_1.User.findOne({ phoneNumber });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    // Check if user is deleted or suspended
    if (user.isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Account has been deleted.");
    }
    if (user.isSuspended) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Account is suspended.");
    }
    // Hash the new password
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_round));
    // Update password
    yield auth_model_1.User.updateOne({ _id: user._id }, {
        $set: {
            password: hashedPassword,
            passwordChangedAt: new Date(),
            resetPasswordOtp: null,
            resetPasswordOtpExpiresAt: null,
        },
    });
    return { message: "Password reset successfully" };
});
const changePassword = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentPassword, newPassword } = payload;
    const user = yield auth_model_1.User.findById(userId).select("+password");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    // Check if user is deleted or suspended
    if (user.isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "User account deleted.");
    }
    if (user.isSuspended) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Account suspended.");
    }
    // Verify current password
    const isPasswordMatched = yield auth_model_1.User.isPasswordMatched(currentPassword, user.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Current password is incorrect.");
    }
    // Hash new password
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_round));
    yield auth_model_1.User.updateOne({ _id: userId }, {
        $set: {
            password: hashedPassword,
            passwordChangedAt: new Date(),
        },
    });
    return { message: "Password changed successfully" };
});
exports.AuthServices = {
    signup,
    loginUser,
    refreshToken,
    forgetPassword,
    verifyForgotPasswordOtp,
    resendForgotPasswordOtp,
    resetPassword,
    changePassword,
};
