"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueReferralCode = void 0;
const generateUniqueReferralCode = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `VWRF-${randomPart}`;
};
exports.generateUniqueReferralCode = generateUniqueReferralCode;
