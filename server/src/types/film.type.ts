import {  Schema } from "mongoose";
import { CommonStatus } from "./common.type"; // Giả sử file common.type.ts nằm cùng cấp

/**
 * Định nghĩa các thuộc tính của một bộ phim.
 * Đây là "nguồn chân lý" cho cấu trúc của một đối tượng Film.
 */
export interface IFilm {
  title: string;
  otherTitles?: string[]; // Có thể có hoặc không
  categoryIds: Schema.Types.ObjectId[]; // Mảng các ID của danh mục
  actors: string[];
  directors: string[];
  releaseDate: Date; // Dùng kiểu Date để dễ dàng thao tác
  availableFormats: string[];
  duration: number; // Thời lượng tính bằng phút
  ageRating: string; // VD: T16, T18, P
  trailer?: string; // Có thể có hoặc không
  thumbnail: string;
  filmLanguage: string;
  subtitles: string;
  description: string;
  slug: string;
  status: CommonStatus; // Sử dụng enum đã định nghĩa
  isTrending: boolean;
  deleted: boolean; // Dùng để đánh dấu xóa mềm
  createdAt?: Date; // Tự động tạo bởi Mongoose
  updatedAt?: Date; // Tự động tạo bởi Mongoose
}

/**
 * Dùng cho update: tất cả các trường đều optional,
 * để bạn có thể update 1 hoặc nhiều field mà không cần truyền toàn bộ.
 */
export type IFilmUpdate = Partial<Omit<IFilm, "createdAt" | "updatedAt" | "slug">>;

/**
 * Type cho dữ liệu khi tạo mới film.
 * Bỏ các trường hệ thống như createdAt, updatedAt, deleted.
 */
export type IFilmCreate = Omit<IFilm, "createdAt" | "updatedAt" | "deleted" | "slug">;
