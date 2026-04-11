import mongoose, { HydratedDocument, Schema, model } from "mongoose";
import { CommonStatus } from "../../../types/common.type";
import { IRoom, ISeat, SeatType } from "../../../types/room.type";

export type IRoomDocument = HydratedDocument<IRoom>;

/**
 * Schema cho một ghế riêng lẻ trong phòng.
 * Đây sẽ là một sub-document trong Room schema.
 */
const seatSchema = new Schema<ISeat>(
  {
    row: { type: String, required: true, trim: true },
    number: { type: Number, required: true },
    type: {
      type: String,
      enum: Object.values(SeatType),
      required: true,
      default: SeatType.STANDARD,
    },
    seatKey: { type: String, required: true, trim: true },
    partnerSeatKey: { type: String, trim: true }, // Optional, chỉ có khi type là "couple"
  },
  {
    _id: false, // Không tạo _id riêng cho mỗi ghế
  }
);

/**
 * Schema định nghĩa cấu trúc của một document Phòng chiếu trong MongoDB.
 */
const roomSchema = new Schema<IRoomDocument>(
  {
    cinemaId: {
      type: Schema.Types.ObjectId,
      ref: "Cinema", // Tham chiếu đến model Cinema
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    seatLayout: {
      type: [seatSchema],
      required: true,
      validate: [
        (val: ISeat[]) => val.length > 0,
        "Sơ đồ ghế không được để trống",
      ],
    },
    supportedFormats: {
      type: [String],
      required: true,
      validate: [
        (val: string[]) => val.length > 0,
        "Phòng phải hỗ trợ ít nhất một định dạng",
      ],
    },
    status: {
      type: String,
      enum: Object.values(CommonStatus),
      required: true,
      default: CommonStatus.ACTIVE,
    },
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
roomSchema.index({ cinemaId: 1 });
roomSchema.index({ name: 1, cinemaId: 1 }, { unique: true }); // Một rạp không nên có hai phòng cùng tên
roomSchema.index({ status: 1 });
roomSchema.index({ deleted: 1 });

/**
 * Model cho Phòng chiếu, được biên dịch từ roomSchema.
 */
const Room = model<IRoomDocument>("Room", roomSchema, "rooms");

export default Room;