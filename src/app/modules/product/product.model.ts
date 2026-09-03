import { Schema, model } from "mongoose";
import { TProduct, TProductVariant, TReview } from "./product.interface";
import slugify from "slugify";

// Dimensions Schema
const dimensionsSchema = new Schema({
  length: {
    type: Number,
    required: true,
    min: 0,
  },
  width: {
    type: Number,
    required: true,
    min: 0,
  },
  height: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    enum: ["cm", "mm", "inch", "m", "ft"],
    default: "cm",
  },
});

// Material Reference Schema (for variant materials)
const materialReferenceSchema = new Schema({
  materialId: {
    type: Schema.Types.ObjectId,
    ref: "Material",
    required: true,
  },
  materialVariantId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    default: "piece",
  },
});

// Variant Schema
const productVariantSchema = new Schema<TProductVariant>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },


  packageContents: {
    type: [String],
    default: [],
  },
  images: {
    type: [String],
    required: true,
    default: [],
  },
  design: {
    type: String,
    required: true,
    trim: true
  },
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
  packSize: {
    type: String,
    trim: true,
    default: "Single",
  },

  dimensions: {
    type: dimensionsSchema,
    required: true,
  },

  weight: {
    type: String, // e.g., "450g", "1.2kg"
    trim: true,
    required: true,
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

  // Material reference - FIXED: Removed default: []
  materials: {
    type: [materialReferenceSchema],
    required: false, // Make it optional if not all variants have materials
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
      index: true,
    },
    subOccasionNames: {
      type: [String],
      default: [],
      index: true,
    },

    careInstructions: {
      type: [String],
      default: [],
    },
    isCustomizationAvailable: {
      type: Boolean,
      default: false,
    },
    processingTime: {
      type: String,
      default: null,
    },

    // Variants - each variant has its own dimensions and weight
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

// Indexes for variant fields
productSchema.index({ "variants.packSize": 1 });
productSchema.index({ "variants.dimensions.length": 1 });
productSchema.index({ "variants.dimensions.width": 1 });
productSchema.index({ "variants.dimensions.height": 1 });
productSchema.index({ "variants.material.materialId": 1 });

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

// Pre-save middleware to generate slug
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