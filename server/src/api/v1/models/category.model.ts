import { Document, Schema, model } from "mongoose";

// Interface cho Category
export interface ICategory extends Document {
  title: string;
}

// Schema cho Category
const categorySchema = new Schema<ICategory>(
  {
    title: { type: String, required: true },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Model với type
const Category = model<ICategory>("Category", categorySchema, "categories");

export default Category;
