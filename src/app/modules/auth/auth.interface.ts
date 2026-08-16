import { Model } from "mongoose";
import { UserRole } from "./auth.constants";

export type TUser = {
  _id: string;
  profilePicture?: string;
  name: string;
  email?: string;
  phoneNumber: string;
  city?: string;
  state?: string;
  address?: string;
  password: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  accountDeleteReason: string | null;
  isSuspended: boolean;
  suspensionReason: string | null;
  lastLoggedIn?: Date;
  resetPasswordOtp?: string;
  resetPasswordOtpExpiresAt?: Date;
  resetPasswordOtpAttempts?: number;
  passwordChangedAt?: Date;
};

export interface UserModel extends Model<TUser> {
  isUserExists(phoneNumber: string): Promise<TUser>;
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
}

export type TUserRole = keyof typeof UserRole;

export type TLoginAuth = {
  phoneNumber: string;
  password: string;
};

// Simplified signup - only 3 fields
export type TSignupPayload = {
  name: string;
  phoneNumber: string;
  password: string;
};