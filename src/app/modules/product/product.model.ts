import { Schema, model } from "mongoose";
import { TProduct, TProductVariant, TReview } from "./product.interface";
import slugify from "slugify";

// Variant Schema
const productVariantSchema = new Schema<TProductVariant>({
  size: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    trim: true,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountedPrice: {
    type: Number,
    min: 0,
  },
  bulkPrice: {
    type: Number,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
});

// Main Product Schema
const productSchema = new Schema<TProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subCategory: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    occasionNames: {
      type: [String],
      required: true,
      trim: true,
      index: true, // For direct filtering
    },
    subOccasionNames: {
      type: [String], // Array of sub-occasion names
      default: [],
      index: true, // For direct filtering
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      required: true,
      default: [],
    },
    material: {
      type: [String],
      default: [],
    },

    // Variants
    variants: {
      type: [productVariantSchema],
      default: [],
      validate: {
        validator: function (variants: TProductVariant[]) {
          return variants.length > 0;
        },
        message: "Product must have at least one variant",
      },
    },

    // Aggregated price fields
    minPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    maxPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    minDiscountedPrice: {
      type: Number,
      min: 0,
    },

    // Reviews
    reviews: {
      type: [Schema.Types.ObjectId],
      ref: "Review",
      default: [],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Stats
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalClicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Text Search Index
productSchema.index({
  name: "text",
  description: "text",
  category: "text",
  "tags": "text",
});

// Compound indexes for common queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ minPrice: 1, maxPrice: 1 });

// Pre-save middleware to calculate aggregated fields
productSchema.pre('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    const prices = this.variants.map(v => v.basePrice);
    const discountedPrices = this.variants
      .map(v => v.discountedPrice)
      .filter((p): p is number => p !== undefined && p !== null);

    this.minPrice = Math.min(...prices);
    this.maxPrice = Math.max(...prices);
    this.minDiscountedPrice = discountedPrices.length > 0
      ? Math.min(...discountedPrices)
      : undefined;
  }
  next();
});

productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
  next();
});

const Product = model<TProduct>("Product", productSchema);

// Review Schema (separate from product)
const reviewSchema = new Schema<TReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Review = model<TReview>("Review", reviewSchema);
export default Product;