// src/types/comment.type.ts
import { Schema } from "mongoose";

/**
 * Định nghĩa các thuộc tính của một Comment.
 * Đây là "nguồn chân lý" cho cấu trúc của một đối tượng Comment.
 */
export interface IComment {
  userId: Schema.Types.ObjectId; // Tham chiếu đến người dùng đã bình luận
  filmId: Schema.Types.ObjectId; // Tham chiếu đến bộ phim được bình luận
  rate: number; // Điểm đánh giá từ 1 đến 5
  content: string; // Nội dung văn bản của bình luận
  isReported: boolean; // Cờ để đánh dấu nếu bình luận bị báo cáo
  createdAt?: Date; // Tự động tạo bởi Mongoose
  updatedAt?: Date; // Tự động tạo bởi Mongoose
}

/**
 * Dùng cho việc cập nhật: tất cả các trường đều là tùy chọn.
 * Người dùng có thể chỉ cập nhật 'rate' hoặc 'content'.
 * Quản trị viên có thể cập nhật 'isReported'.
 */
export type ICommentUpdate = Partial<Pick<IComment, "rate" | "content" | "isReported">>;

/**
 * Kiểu dữ liệu khi tạo một Comment mới.
 * Bỏ qua các trường do hệ thống tạo. 'isReported' sẽ có giá trị mặc định là false.
 */
export type ICommentCreate = Omit<IComment, "createdAt" | "updatedAt" | "isReported">;