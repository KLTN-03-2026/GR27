import { Document, HydratedDocument, Schema, model } from "mongoose";
import {IUser, UserRole, UserStatus } from "../../../types/user.type";

export type IUserDocument = HydratedDocument<IUser>;


// Schema cho User
const userSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true, unique: true },
    fullname: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    address: String,
    avatar: String,
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    refreshToken: { type: String }, 
    status: { type: String, enum: Object.values(UserStatus), required: true },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);


// userSchema.index({ username: 1 });
// userSchema.index({ email: 1 });
// Bỏ hai index này vì đã có unique: true(tự tạo index rồi)
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ refreshToken: 1, deleted: 1 }); 
userSchema.index({ deleted: 1 });

// Model với type
const User = model<IUserDocument>("User", userSchema, "users");

export default User;