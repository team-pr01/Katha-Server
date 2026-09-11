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
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMuhurtaLimit = exports.checkKundliLimit = exports.checkVastuAiLimit = exports.checkAiRecipesLimit = exports.checkAiChatLimit = void 0;
const plans_1 = require("../constants/plans");
const auth_model_1 = require("../modules/auth/auth.model");
const checkAiChatLimit = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findById(req.user.userId);
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }
    const planConfig = plans_1.Plans[user === null || user === void 0 ? void 0 : user.plan];
    // Extract actual AI Chat daily limit from Plans
    const dailyLimit = planConfig.aiChatDaily;
    const today = new Date().toDateString();
    const lastReset = user.usage.lastDailyReset
        ? user.usage.lastDailyReset.toDateString()
        : null;
    // 🔄 Daily reset
    if (lastReset !== today) {
        yield auth_model_1.User.findOneAndUpdate({ _id: user._id }, {
            $set: {
                "usage.aiChatDaily": 0,
                "usage.lastDailyReset": new Date(),
            },
        });
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
    yield auth_model_1.User.findOneAndUpdate({ _id: user._id }, {
        $inc: {
            "usage.aiChatDaily": 1,
        },
    });
    next();
});
exports.checkAiChatLimit = checkAiChatLimit;
const checkAiRecipesLimit = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield auth_model_1.User.findById(req.user.userId);
    if (!user)
        return res.status(400).json({ message: "User not found" });
    const planConfig = plans_1.Plans[user.plan];
    const monthlyLimit = planConfig.aiRecipesMonthly;
    const nowMonth = new Date().getMonth();
    const lastResetMonth = (_a = user.usage.lastMonthlyReset) === null || _a === void 0 ? void 0 : _a.getMonth();
    if (lastResetMonth !== nowMonth) {
        yield auth_model_1.User.findOneAndUpdate({ _id: user._id }, {
            $set: {
                "usage.aiRecipesMonthly": 0,
                "usage.lastMonthlyReset": new Date(),
            },
        });
        user.usage.aiRecipesMonthly = 0;
    }
    if (monthlyLimit !== Infinity && user.usage.aiRecipesMonthly >= monthlyLimit) {
        return res.status(403).json({ success: false, message: "Monthly AI Recipes limit reached. Please try again next month or upgrade your plan." });
    }
    yield auth_model_1.User.findOneAndUpdate({ _id: user._id }, { $inc: { "usage.aiRecipesMonthly": 1 } });
    next();
});
exports.checkAiRecipesLimit = checkAiRecipesLimit;
const checkVastuAiLimit = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield auth_model_1.User.findById(req.user.userId);
    if (!user)
        return res.status(400).json({ message: "User not found" });
    const planConfig = plans_1.Plans[user.plan];
    const monthlyLimit = planConfig.vastuAiMonthly;
    const nowMonth = new Date().getMonth();
    const lastResetMonth = (_a = user.usage.lastMonthlyReset) === null || _a === void 0 ? void 0 : _a.getMonth();
    if (lastResetMonth !== nowMonth) {
        yield auth_model_1.User.findOneAndUpdate({ _id: user._id }, {
            $set: {
                "usage.vastuAiMonthly": 0,
                "usage.lastMonthlyReset": new Date(),
            },
        });
        user.usage.vastuAiMonthly = 0;
    }
    if (monthlyLimit !== Infinity && user.usage.vastuAiMonthly >= monthlyLimit) {
        return res.status(403).json({ success: false, message: "Monthly Vastu AI limit reached. Please try again next month or upgrade your plan." });
    }
    yield auth_model_1.User.findOneAndUpdate({ _id: user._id }, { $inc: { "usage.vastuAiMonthly": 1 } });
    next();
});
exports.checkVastuAiLimit = checkVastuAiLimit;
const checkKundliLimit = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield auth_model_1.User.findById(req.user.userId);
    if (!user)
        return res.status(400).json({ message: "User not found" });
    const planConfig = plans_1.Plans[user.plan];
    const monthlyLimit = planConfig === null || planConfig === void 0 ? void 0 : planConfig.kundliMonthly;
    const nowMonth = new Date().getMonth();
    const lastResetMonth = (_a = user.usage.lastMonthlyReset) === null || _a === void 0 ? void 0 : _a.getMonth();
    if (lastResetMonth !== nowMonth) {
        yield auth_model_1.User.findOneAndUpdate({ _id: user._id }, {
            $set: {
                "usage.kundliMonthly": 0,
                "usage.lastMonthlyReset": new Date(),
            },
        });
        user.usage.kundliMonthly = 0;
    }
    if (monthlyLimit !== Infinity && user.usage.kundliMonthly >= monthlyLimit) {
        return res.status(403).json({ success: false, message: "Monthly Kundli limit reached. Please try again next month or upgrade your plan." });
    }
    yield auth_model_1.User.findOneAndUpdate({ _id: user._id }, { $inc: { "usage.kundliMonthly": 1 } });
    next();
});
exports.checkKundliLimit = checkKundliLimit;
const checkMuhurtaLimit = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield auth_model_1.User.findById(req.user.userId);
    if (!user)
        return res.status(400).json({ message: "User not found" });
    const planConfig = plans_1.Plans[user.plan];
    const monthlyLimit = planConfig.muhurtaMonthly;
    const nowMonth = new Date().getMonth();
    const lastResetMonth = (_a = user.usage.lastMonthlyReset) === null || _a === void 0 ? void 0 : _a.getMonth();
    if (lastResetMonth !== nowMonth) {
        yield auth_model_1.User.findOneAndUpdate({ _id: user._id }, {
            $set: {
                "usage.muhurtaMonthly": 0,
                "usage.lastMonthlyReset": new Date(),
            },
        });
        user.usage.muhurtaMonthly = 0;
    }
    if (monthlyLimit !== Infinity && user.usage.muhurtaMonthly >= monthlyLimit) {
        return res.status(403).json({ success: false, message: "Monthly Muhurta limit reached. Please try again next month or upgrade your plan." });
    }
    yield auth_model_1.User.findOneAndUpdate({ _id: user._id }, { $inc: { "usage.muhurtaMonthly": 1 } });
    next();
});
exports.checkMuhurtaLimit = checkMuhurtaLimit;
