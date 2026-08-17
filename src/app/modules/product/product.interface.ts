import { ObjectId } from "mongoose";

export type TProductVariant = {
  size: string;
  color: string;
  basePrice: number;
  discountedPrice?: number;
  bulkPrice?: number; // For shopkeepers/bulk buyers
  stock: number;
};

// Review interface
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
  slug: string;
  category: string;
  subCategory: string;
  occasionNames: string[];
  subOccasionNames: string[];
  description: string;
  images: string[];
  material: string[];
  
  // Variants
  variants: TProductVariant[];
  
  // Aggregated fields (calculated from variants)
  minPrice: number;
  maxPrice: number;
  minDiscountedPrice?: number;
  
  // Review related
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
  occasionNames?: string[];
  subOccasionNames?: string[];
};

export type TProductSortOptions = {
  field: 'price_low_to_high' | 'price_high_to_low' | 'popular' | 'top_rated' | 'newest';
};