import { Document, Schema, model } from "mongoose";

// Interface cho Otp
export interface IOtp extends Document {
  email: string;
  otp: string;
  type: string;
  expiresAt: Date;
}

// Schema cho Otp
const otpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    type: { type: String, required: true },
    expiresAt: {
      type: Date,
      default: Date.now(),
      expires: 300,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Model với type
const Otp = model<IOtp>("Otp", otpSchema, "otps");

export default Otp;
