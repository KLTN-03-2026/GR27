// src/models/film/film.model.ts

import mongoose, { HydratedDocument, Schema, model } from "mongoose";
import { IFilm } from "../../../types/film.type";
import { CommonStatus } from "../../../types/common.type";
import slug from "mongoose-slug-updater";

// Kích hoạt plugin slug
mongoose.plugin(slug);


export type IFilmDocument = HydratedDocument<IFilm>;
/**
 * Schema định nghĩa cấu trúc của document Film trong MongoDB.
 * Nó ánh xạ từ IFilmDocument interface để đảm bảo type-safety.
 */
const filmSchema = new Schema<IFilmDocument>(
  {
    title: { type: String, required: true, trim: true },
    otherTitles: [String],
    // Thiết lập tham chiếu đến model 'Category'
    // Giúp cho việc populate dữ liệu danh mục sau này dễ dàng hơn.
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category', required: true }],
    actors: [String],
    directors: [String],
    releaseDate: { type: Date, required: true },
    availableFormats: [String],
    duration: { type: Number, required: true }, // Thời lượng tính bằng phút
    ageRating: String,
    trailer: String,
    thumbnail: { type: String, required: true },
    filmLanguage: { type: String, required: true },
    subtitles: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    // Slug rất quan trọng cho SEO và URL, nên là duy nhất và viết thường
    slug: {
      type: String,
      slug: "title",
      unique: true,
      slugPaddingSize: 4,
    },
    status: {
      type: String,
      enum: Object.values(CommonStatus),
      required: true,
      default: CommonStatus.INACTIVE,
    },
    isTrending: {
      type: Boolean,
      default: false,
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
filmSchema.index({ title: 'text', slug: 1 }); // Index cho tìm kiếm text trên title và truy vấn nhanh theo slug
filmSchema.index({ slug: 1, deleted: 1, status: 1 });
filmSchema.index({ slug: 1, deleted: 1});
/**
 * Model cho Film, được biên dịch từ filmSchema.
 * Cung cấp một interface để tương tác với collection 'films' trong database.
 * - "Film": Tên của model, dùng trong Mongoose.
 * - filmSchema: Schema được sử dụng.
 * - "films": Tên của collection trong MongoDB (viết thường, số nhiều).
 */
const Film = model<IFilmDocument>("Film", filmSchema, "films");

export default Film;