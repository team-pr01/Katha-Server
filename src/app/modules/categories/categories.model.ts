import { Schema, model } from "mongoose";
import { TCategories } from "./categories.interface";

const categorySchema = new Schema<TCategories>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    areaName: {
      type: String,
      trim: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Text Search Index
categorySchema.index({
  name: "text",
  areaName: "text",
  description: "text",
  subCategories: "text",
});

// Index for filtering
categorySchema.index({ areaName: 1, isActive: 1 });
categorySchema.index({ name: 1, areaName: 1 });

const Categories = model<TCategories>("Categories", categorySchema);

export default Categories;