import Order from "../modules/order/order.model";

/**
 * Generate a unique order ID in format: K-DDMMYY-SEQUENCE
 * Example: K-040826-00001
 * 
 * K is static prefix
 * DDMMYY is current date (day-month-year)
 * SEQUENCE is auto-incrementing 5-digit number
 */
export const generateOrderId = async (): Promise<string> => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const dateStr = `${day}${month}${year}`;

    // Get the last order to increment sequence
    const lastOrder = await Order.findOne({}, {}, { sort: { createdAt: -1 } });
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
};