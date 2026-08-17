
export type TCategories = {
  name: string;
  areaName?: string; // e.g., "Handicraft", "Clothing", "Home Decor"
  imageUrl: string;
  description?: string;
  isActive: boolean;
  subCategories?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type TCategoryFilters = {
  search?: string;
  areaName?: string;
  isActive?: boolean;
};