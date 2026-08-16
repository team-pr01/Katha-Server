import { ObjectId } from "mongoose";

// Variant interface for different size-color combinations
export type TProductVariant = {
  size: string; // e.g., "S", "M", "L", "XL", "38", "40"
  color: string; // e.g., "Red", "Blue", "Black"
  basePrice: number;
  discountedPrice?: number;
  bulkPrice?: number; // For shopkeepers/bulk buyers
  stock: number;
  sku: string; // Unique SKU for this variant
  images?: string[]; // Variant-specific images
};

// Review interface (separate schema)
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
  category: string;
  occasion?: string; // e.g., "Wedding", "Casual", "Festival"
  description: string;
  images: string[]; // Main product images
  material: string[]; // Array of materials used
  
  // Variants
  variants: TProductVariant[];
  
  // Aggregated fields (calculated from variants)
  minPrice: number;
  maxPrice: number;
  minDiscountedPrice?: number;
  
  // Review related
  reviews: ObjectId[]; // References to Review documents
  averageRating: number;
  totalReviews: number;
  
  // Stats
  soldCount: number;
  totalClicks: number;
  
  // Metadata
  addedBy: ObjectId; // Vendor ID
  isActive: boolean;
  isFeatured?: boolean;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

// Filter and sort types
export type TProductFilters = {
  category?: string;
  occasion?: string;
  material?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string; // For text search
  minRating?: number;
  inStock?: boolean;
  isFeatured?: boolean;
};

export type TProductSortOptions = {
  field: 'price_low_to_high' | 'price_high_to_low' | 'popular' | 'top_rated' | 'newest';
};