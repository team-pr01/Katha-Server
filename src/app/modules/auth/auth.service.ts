/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { TLoginAuth, TSignupPayload } from "./auth.interface";
import AppError from "../../errors/AppError";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import { User } from "./auth.model";
import { sendEmail } from "../../utils/sendEmail";
import bcrypt from "bcrypt";
import { createToken } from "./auth.utils";
import { generate4DigitsOTP } from "../../utils/generate4DigitsOTP";

// Signup with auto-login (Only 3 fields: name, phoneNumber, password)
const signup = async (payload: TSignupPayload) => {
  const { name, phoneNumber, password } = payload;

  // Check if user already exists with this phone number
  const existingUser = await User.findOne({ phoneNumber });

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
      
      await existingUser.save();

      // Generate tokens for restored user
      const jwtPayload = {
        userId: existingUser._id.toString(),
        name: existingUser.name,
        phoneNumber: existingUser.phoneNumber,
        email: existingUser.email || "",
        role: existingUser.role,
      };

      const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string
      );

      const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as string
      );

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
    throw new AppError(
      httpStatus.CONFLICT,
      "User already exists with this phone number."
    );
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

  const newUser = await User.create(userData);

  // Generate tokens for new user (auto-login)
  const jwtPayload = {
    userId: newUser._id.toString(),
    name: newUser.name,
    phoneNumber: newUser.phoneNumber,
    email: newUser.email || "",
    role: newUser.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

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
};

// Login using phone number
const loginUser = async (payload: TLoginAuth) => {
  const { phoneNumber, password } = payload;

  // Check if the user exists
  const user = await User.isUserExists(phoneNumber);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Invalid phone number or password.");
  }

  // Check if the user is deleted
  if (user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Invalid phone number or password.");
  }

  // Check if the user is suspended
  if (user.isSuspended) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account has been suspended. Please contact support for assistance."
    );
  }

  // Check if the password is correct
  if (!(await User.isPasswordMatched(password, user.password))) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid phone number or password.");
  }

  // Update last login
  await User.updateOne(
    { _id: user._id },
    { $set: { lastLoggedIn: new Date() } }
  );

  // Create token
  const jwtPayload = {
    userId: user._id.toString(),
    name: user.name,
    phoneNumber: user.phoneNumber,
    email: user.email || "",
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

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
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to proceed!"
    );
  }

  const decoded = jwt.verify(
    token,
    config.jwt_refresh_secret as string
  ) as JwtPayload;

  const { userId } = decoded;

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "User account deleted.");
  }

  if (user.isSuspended) {
    throw new AppError(httpStatus.FORBIDDEN, "Account suspended.");
  }

  const jwtPayload = {
    userId: user._id.toString(),
    name: user.name,
    phoneNumber: user.phoneNumber,
    email: user.email || "",
    role: user.role,
  };
  
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  return {
    accessToken,
  };
};

const forgetPassword = async (phoneNumber: string) => {
  const user = await User.findOne({ phoneNumber });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  const otp = generate4DigitsOTP();

  await User.updateOne(
    { phoneNumber },
    {
      resetPasswordOtp: otp,
      resetPasswordOtpExpiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 min
    }
  );

  // If email exists, send OTP via email
  if (user.email) {
    const htmlBody = `
      <p>Hello <strong>${user?.name || "User"}</strong>,</p>
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

    await sendEmail(user.email, htmlBody, "Reset your password within 2 minutes");
  }

  // TODO: Also send OTP via SMS if SMS service is configured

  return { message: "OTP sent successfully" };
};

const verifyForgotPasswordOtp = async (payload: {
  phoneNumber: string;
  otp: string;
}) => {
  const { phoneNumber, otp } = payload;

  const user = await User.findOne({ phoneNumber });

  if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpiresAt) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP.");
  }

  // Expiry check
  if (new Date(user.resetPasswordOtpExpiresAt) < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP expired.");
  }

  // Wrong OTP
  if (user.resetPasswordOtp !== otp) {
    await User.updateOne(
      { phoneNumber },
      { $inc: { resetPasswordOtpAttempts: 1 } }
    );

    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP.");
  }

  return { message: "OTP verified successfully" };
};

const resendForgotPasswordOtp = async (phoneNumber: string) => {
  const user = await User.findOne({ phoneNumber });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  const otp = generate4DigitsOTP();

  await User.updateOne(
    { phoneNumber },
    {
      resetPasswordOtp: otp,
      resetPasswordOtpExpiresAt: new Date(Date.now() + 2 * 60 * 1000),
      resetPasswordOtpAttempts: 0,
    }
  );

  // If email exists, send OTP via email
  if (user.email) {
    await sendEmail(
      user.email,
      `<p>Your new OTP: <strong>${otp}</strong></p><p>Valid for 2 minutes.</p>`,
      "Resend Reset Password OTP"
    );
  }

  return { message: "New OTP sent successfully" };
};

const resetPassword = async (payload: {
  phoneNumber: string;
  newPassword: string;
}) => {
  const { phoneNumber, newPassword } = payload;

  const user = await User.findOne({ phoneNumber });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  // Check if user is deleted or suspended
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "Account has been deleted.");
  }

  if (user.isSuspended) {
    throw new AppError(httpStatus.FORBIDDEN, "Account is suspended.");
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_round)
  );

  // Update password
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        resetPasswordOtp: null,
        resetPasswordOtpExpiresAt: null,
      },
    }
  );

  return { message: "Password reset successfully" };
};

const changePassword = async (
  userId: string,
  payload: {
    currentPassword: string;
    newPassword: string;
  }
) => {
  const { currentPassword, newPassword } = payload;

  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  // Check if user is deleted or suspended
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "User account deleted.");
  }

  if (user.isSuspended) {
    throw new AppError(httpStatus.FORBIDDEN, "Account suspended.");
  }

  // Verify current password
  const isPasswordMatched = await User.isPasswordMatched(
    currentPassword,
    user.password
  );

  if (!isPasswordMatched) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Current password is incorrect."
    );
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_round)
  );

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    }
  );

  return { message: "Password changed successfully" };
};

export const AuthServices = {
  signup,
  loginUser,
  refreshToken,
  forgetPassword,
  verifyForgotPasswordOtp,
  resendForgotPasswordOtp,
  resetPassword,
  changePassword,
};