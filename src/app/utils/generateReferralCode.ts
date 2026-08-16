export const generateUniqueReferralCode = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let randomPart = "";

    for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `VWRF-${randomPart}`;
};