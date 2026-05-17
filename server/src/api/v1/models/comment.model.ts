// src/api/v1/models/comment.model.ts
import mongoose, { HydratedDocument, Schema, model } from "mongoose";
import { IComment } from "../../../types/comment.type";

export type ICommentDocument = HydratedDocument<IComment>;


const commentSchema = new Schema<ICommentDocument>(
  {
    
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Tham chiếu đến model Film.
    filmId: {
      type: Schema.Types.ObjectId,
      ref: "Film",
      required: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 1, // Đánh giá phải ít nhất là 1 sao
      max: 5, // Đánh giá tối đa là 5 sao
    },
    content: {
      type: String,
      required: true,
      trim: true, // Tự động loại bỏ khoảng trắng thừa
    },
    isReported: {
      type: Boolean,
      default: false, // Theo mặc định, một bình luận không bị báo cáo
    },
  },
  {
    timestamps: true, 
    versionKey: false, 
  }
);

// Tối ưu hóa truy vấn bằng cách tạo index cho các trường hay được tìm kiếm
commentSchema.index({ filmId: 1, createdAt: -1 }); // Để lấy nhanh tất cả bình luận cho một phim, sắp xếp theo mới nhất
commentSchema.index({ userId: 1 }); // Để tìm tất cả bình luận của một người dùng
commentSchema.index({ isReported: 1 }); // Index cho trường isReported để lọc các bình luận bị báo cáo nhanh hơn


const Comment = model<ICommentDocument>("Comment", commentSchema, "comments");

export default Comment;