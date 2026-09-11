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
exports.generateOrderId = void 0;
const order_model_1 = __importDefault(require("../modules/order/order.model"));
/**
 * Generate a unique order ID in format: K-DDMMYY-SEQUENCE
 * Example: K-040826-00001
 *
 * K is static prefix
 * DDMMYY is current date (day-month-year)
 * SEQUENCE is auto-incrementing 5-digit number
 */
const generateOrderId = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const dateStr = `${day}${month}${year}`;
    // Get the last order to increment sequence
    const lastOrder = yield order_model_1.default.findOne({}, {}, { sort: { createdAt: -1 } });
    let sequence = 1;
    if (lastOrder && lastOrder.orderId) {
        const parts = lastOrder.orderId.split("-");
        if (parts.length === 3) {
            const lastSeq = parseInt(parts[2]);
            sequence = lastSeq + 1;
        }
    }
    const seqStr = String(sequence).padStart(5, "0");
    return `K-${dateStr}-${seqStr}`;
});
exports.generateOrderId = generateOrderId;
