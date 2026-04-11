// src/types/cinema.type.ts
import { Schema } from "mongoose";
import { CommonStatus } from "./common.type"; 

/**
 * Định nghĩa các thuộc tính của một bộ Cinema.
 * Đây là "nguồn chân lý" cho cấu trúc của một đối tượng Cinema.
 */
export interface ICinema {
  name: string;
  parentId: Schema.Types.ObjectId;
  address: string;
  avatar: string;
  description: string;
  cityIds: Schema.Types.ObjectId[]; // ✅ THAY ĐỔI: từ cityId thành cityIds (mảng)
  slug: string;
  status: CommonStatus; // Sử dụng enum đã định nghĩa
  deleted: boolean; // Dùng để đánh dấu xóa mềm
  createdAt?: Date; // Tự động tạo bởi Mongoose
  updatedAt?: Date; // Tự động tạo bởi Mongoose
}

/**
 * Dùng cho update: tất cả các trường đều optional,
 * để bạn có thể update 1 hoặc nhiều field mà không cần truyền toàn bộ.
 */
export type ICinemaUpdate = Partial<Omit<ICinema, "createdAt" | "updatedAt" | "slug">>;

/**
 * Type cho dữ liệu khi tạo mới Cinema.
 * Bỏ các trường hệ thống như createdAt, updatedAt, deleted.
 */
export type ICinemaCreate = Omit<ICinema, "createdAt" | "updatedAt" | "deleted" | "slug">;