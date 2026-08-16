import { ObjectId } from "mongoose";

export type TSubOccasion = {
  name: string;
  description?: string;
  _id?: ObjectId;
};

export type TOccasion = {
  name: string;
  subOccasions: TSubOccasion[];
  imageUrl: string;
  description: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TOccasionFilters = {
  search?: string;
  isActive?: boolean;
};