import mongoose, { Document, Schema, model } from "mongoose";
import slug from "mongoose-slug-updater";

// Kích hoạt plugin slug

mongoose.plugin(slug);

// Interface cho Category
export interface ICity extends Document {
  name: string;
  slug: string;
}

// Schema cho City
const citySchema = new Schema<ICity>(
  {
    name: { type: String, required: true },
    slug: {
      type: String,
      slug: "name",
      unique: true,
      slugPaddingSize: 4,
    },
  
  },

  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Model với type
const City = model<ICity>("City", citySchema, "cities");

export default City;
