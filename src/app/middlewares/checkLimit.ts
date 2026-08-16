import { NextFunction, Request, Response } from "express";
import { Plans } from "../constants/plans";
import { User } from "../modules/auth/auth.model";

export const checkAiChatLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const planConfig = Plans[user?.plan as keyof typeof Plans];

  // Extract actual AI Chat daily limit from Plans
  const dailyLimit = planConfig.aiChatDaily;

  const today = new Date().toDateString();
  const lastReset = user.usage.lastDailyReset
    ? user.usage.lastDailyReset.toDateString()
    : null;

  // 🔄 Daily reset
  if (lastReset !== today) {
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          "usage.aiChatDaily": 0,
          "usage.lastDailyReset": new Date(),
        },
      }
    );

    user.usage.aiChatDaily = 0;
  }

  // ❌ Block if limit reached (Infinity means no limit)
  if (dailyLimit !== Infinity && user.usage.aiChatDaily >= dailyLimit) {
    return res.status(403).json({
      success: false,
      message: "Daily AI Chat limit reached. Please try again tomorrow or upgrade your plan.",
    });
  }

  // ✅ Increase count (atomic update)
  await User.findOneAndUpdate(
    { _id: user._id },
    {
      $inc: {
        "usage.aiChatDaily": 1,
      },
    }
  );

  next();
};

export const checkAiRecipesLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(400).json({ message: "User not found" });

  const planConfig = Plans[user.plan as keyof typeof Plans];
  const monthlyLimit = planConfig.aiRecipesMonthly;

  const nowMonth = new Date().getMonth();
  const lastResetMonth = user.usage.lastMonthlyReset?.getMonth();

  if (lastResetMonth !== nowMonth) {
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          "usage.aiRecipesMonthly": 0,
          "usage.lastMonthlyReset": new Date(),
        },
      }
    );
    user.usage.aiRecipesMonthly = 0;
  }

  if (monthlyLimit !== Infinity && user.usage.aiRecipesMonthly >= monthlyLimit) {
    return res.status(403).json({ success: false, message: "Monthly AI Recipes limit reached. Please try again next month or upgrade your plan." });
  }

  await User.findOneAndUpdate({ _id: user._id }, { $inc: { "usage.aiRecipesMonthly": 1 } });
  next();
};

export const checkVastuAiLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(400).json({ message: "User not found" });

  const planConfig = Plans[user.plan as keyof typeof Plans];
  const monthlyLimit = planConfig.vastuAiMonthly;

  const nowMonth = new Date().getMonth();
  const lastResetMonth = user.usage.lastMonthlyReset?.getMonth();

  if (lastResetMonth !== nowMonth) {
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          "usage.vastuAiMonthly": 0,
          "usage.lastMonthlyReset": new Date(),
        },
      }
    );
    user.usage.vastuAiMonthly = 0;
  }

  if (monthlyLimit !== Infinity && user.usage.vastuAiMonthly >= monthlyLimit) {
    return res.status(403).json({ success: false, message: "Monthly Vastu AI limit reached. Please try again next month or upgrade your plan." });
  }

  await User.findOneAndUpdate({ _id: user._id }, { $inc: { "usage.vastuAiMonthly": 1 } });
  next();
};

export const checkKundliLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(400).json({ message: "User not found" });

  const planConfig = Plans[user.plan as keyof typeof Plans];
  const monthlyLimit = planConfig?.kundliMonthly;

  const nowMonth = new Date().getMonth();
  const lastResetMonth = user.usage.lastMonthlyReset?.getMonth();

  if (lastResetMonth !== nowMonth) {
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          "usage.kundliMonthly": 0,
          "usage.lastMonthlyReset": new Date(),
        },
      }
    );
    user.usage.kundliMonthly = 0;
  }

  if (monthlyLimit !== Infinity && user.usage.kundliMonthly >= monthlyLimit) {
    return res.status(403).json({ success: false, message: "Monthly Kundli limit reached. Please try again next month or upgrade your plan." });
  }

  await User.findOneAndUpdate({ _id: user._id }, { $inc: { "usage.kundliMonthly": 1 } });
  next();
};

export const checkMuhurtaLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(400).json({ message: "User not found" });

  const planConfig = Plans[user.plan as keyof typeof Plans];
  const monthlyLimit = planConfig.muhurtaMonthly;

  const nowMonth = new Date().getMonth();
  const lastResetMonth = user.usage.lastMonthlyReset?.getMonth();

  if (lastResetMonth !== nowMonth) {
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          "usage.muhurtaMonthly": 0,
          "usage.lastMonthlyReset": new Date(),
        },
      }
    );
    user.usage.muhurtaMonthly = 0;
  }

  if (monthlyLimit !== Infinity && user.usage.muhurtaMonthly >= monthlyLimit) {
    return res.status(403).json({ success: false, message: "Monthly Muhurta limit reached. Please try again next month or upgrade your plan." });
  }

  await User.findOneAndUpdate({ _id: user._id }, { $inc: { "usage.muhurtaMonthly": 1 } });
  next();
};