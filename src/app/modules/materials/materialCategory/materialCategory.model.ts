import { Schema, model } from "mongoose";
import { TMaterialCategory } from "./materialCategory.interface";

const materialCategorySchema = new Schema<TMaterialCategory>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        subCategories: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Text search index
materialCategorySchema.index({
    name: "text",
    subCategories: "text",
});

const MaterialCategory = model<TMaterialCategory>(
    "MaterialCategory",
    materialCategorySchema
);

export default MaterialCategory;