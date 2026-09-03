import { TDimensions } from "../product/product.interface";

export type TMaterialVariant = {
    design: string;
    color: string;
    dimensions: TDimensions;
    stock: number;
    stockUnit: string; // e.g., "roll", "meter", "piece", "kg"
    purchasePrice: number;
    madeOf: string; // e.g., "Cotton", "Silk", "Brass", "Wood"
};

export type TMaterials = {
    name: string;
    category: string;
    subCategory: string;
    variants: TMaterialVariant[];
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

export type TMaterialFilters = {
    search?: string;
    category?: string;
    subCategory?: string;
    madeOf?: string;
    isActive?: boolean;
};