/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from "../modules/auth/auth.model";
import { Notification } from "../modules/notification/notification.model";
import { io } from "../socket";

export const sendNotificationToMultipleUsers = async (
  userIds: any[],
  title: string,
  message: string,
  data?: any
) => {
  if (!userIds.length) return;

  // 1️⃣ Fetch users
  const users = await User.find({ _id: { $in: userIds } }).select("_id");

  if (!users.length) return;

  // 2️⃣ Save ONE notification entry
  const createdNotification = await Notification.create({
    to: users.map((u) => u._id),
    title,
    message,
    data,
  });

  // 3️⃣ Emit socket event ONLY to intended users
  users.forEach((user) => {
    io.to(user._id.toString()).emit("new-notification", {
      _id: createdNotification._id,
      title,
      message,
      data,
      createdAt: createdNotification.createdAt,
    });
  });
};
