"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate4DigitsOTP = void 0;
const generate4DigitsOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};
exports.generate4DigitsOTP = generate4DigitsOTP;
