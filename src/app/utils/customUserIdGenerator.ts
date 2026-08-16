import { Counter } from "../modules/counter/counter.model";

export const customUserIdGenerator = async (): Promise<string> => {
    const counter = await Counter.findOneAndUpdate(
        { id: "userId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    if (!counter) {
        throw new Error("Failed to generate user ID");
    }

    return `VW${String(counter.seq).padStart(4, "0")}`;
};