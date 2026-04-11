import { Document, Schema, model } from "mongoose";

// Interface cho ComboFood
export interface IComboFood extends Document {
  name: string;
  price: number;
  description: string;
  status: string;
  deleted: boolean;
}

// Schema cho ComboFood
const comboFoodSchema = new Schema<IComboFood>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    status: { type: String, required: true },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Model với type
const ComboFood = model<IComboFood>("ComboFood", comboFoodSchema, "combofoods");

export default ComboFood;
