import { Document, Schema, model } from "mongoose";

// Interface cho ResetToken
export interface IResetToken extends Document {
  email: string;
  resetToken: string;
  expiresAt: Date;
}

// Schema cho ResetToken
const resetTokenSchema = new Schema<IResetToken>(
  {
    email: String,
    resetToken: String,
    expiresAt: {
      type: Date,
      expires: 300,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Model với type
const ResetToken = model<IResetToken>("ResetToken", resetTokenSchema, "reset-tokens");

export default ResetToken;
