// src/api/v1/models/cinema.model.ts
import mongoose, { HydratedDocument, Schema, model } from "mongoose";
import { CommonStatus } from "../../../types/common.type";
import slug from "mongoose-slug-updater";
import { ICinema } from "../../../types/cinema.type";

// Kích hoạt plugin slug
mongoose.plugin(slug);

export type ICinemaDocument = HydratedDocument<ICinema>;

const cinemaSchema = new Schema<ICinemaDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Cinema",
    },
    address: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // ✅ THAY ĐỔI: từ cityId thành cityIds (mảng)
    cityIds: [{
      type: Schema.Types.ObjectId,
      ref: "City",
      required: true,
    }],
    // Slug rất quan trọng cho SEO và URL, nên là duy nhất và viết thường
    slug: {
      type: String,
      slug: "name",
      unique: true,
      slugPaddingSize: 4,
    },
    status: {
      type: String,
      enum: Object.values(CommonStatus),
      required: true,
      default: CommonStatus.INACTIVE,
    },
    // Dùng cho soft-delete
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Tự động quản lý createdAt và updatedAt
    versionKey: false, // Tắt trường __v không cần thiết
  }
);

// Tối ưu hóa truy vấn bằng cách tạo index cho các trường hay được tìm kiếm
cinemaSchema.index({ name: "text", slug: 1 }); // Index cho tìm kiếm text trên title và truy vấn nhanh theo slug
cinemaSchema.index({ cityIds: 1 }); // ✅ THAY ĐỔI: Index cho tìm kiếm nhanh theo cityIds (mảng)
cinemaSchema.index({ parentId: 1 }); // Index cho tìm kiếm nhanh theo parentId
cinemaSchema.index({ slug: 1, deleted: 1, status: 1 });
cinemaSchema.index({ slug: 1, deleted: 1});

const Cinema = model<ICinemaDocument>("Cinema", cinemaSchema, "cinemas");

export default Cinema;