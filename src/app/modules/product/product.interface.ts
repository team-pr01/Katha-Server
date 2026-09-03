import { ObjectId } from "mongoose";

type TUnits = 'cm' | 'mm' | 'inch' | 'm' | 'ft';

export type TDimensions = {
  length: number;
  width: number;
  height: number;
  unit: TUnits;
};

export type TProductVariant = {
  name: string;
  images: string[];
  description: string;
  packageContents: string[];
  design: string;
  size: string;
  color: string;
  packSize: string; // e.g., "Single", "Pack of 2", "Pack of 4"
  dimensions: TDimensions;
  weight: string; // e.g., "450g", "1.2kg"
  basePrice: number;
  discountedPrice?: number;
  bulkPrice?: number;
  stock: number;
  materials: {
    materialId: ObjectId;
    materialVariantId: ObjectId;
    quantity: number;
    unit: string;
  }[];
};

export type TReview = {
  user: ObjectId;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type TProduct = {
  name: string;
  slug?: string;
  category: string;
  subCategory: string;
  occasionNames: string[];
  subOccasionNames: string[];
  careInstructions: string[];
  isCustomizationAvailable: boolean;
  processingTime?: string;

  // Variants
  variants: TProductVariant[];

  // Aggregated fields
  minPrice: number;
  maxPrice: number;
  minDiscountedPrice?: number;

  // Reviews
  reviews: ObjectId[];
  averageRating: number;
  totalReviews: number;

  // Stats
  soldCount: number;
  totalClicks: number;

  // Metadata
  isActive: boolean;
  isFeatured?: boolean;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type TProductFilters = {
  category?: string[];
  subCategory?: string[];
  occasionNames?: string[];
  subOccasionNames?: string[];
  material?: string[];
  packSize?: string[]; // Filter by pack size
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
  minRating?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  minLength?: number; // Filter by dimensions
  maxLength?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
};

export type TProductSortOptions = {
  field: 'price_low_to_high' | 'price_high_to_low' | 'popular' | 'top_rated' | 'newest';
};