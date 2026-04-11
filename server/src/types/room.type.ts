import { Schema } from "mongoose";
import { CommonStatus } from "./common.type";

/**
 * Enum cho các loại ghế khác nhau.
 */
export enum SeatType {
  STANDARD = "standard",
  VIP = "vip",
  COUPLE = "couple",
}

/**
 * Interface cho một đối tượng ghế trong sơ đồ.
 */
export interface ISeat {
  row: string;
  number: number;
  type: SeatType;
  seatKey: string; // Kết hợp của hàng và số, ví dụ: "A1", "B12"
  partnerSeatKey?: string; // Chỉ có khi type là "couple", ví dụ: "C6"
}

/**
 * Định nghĩa các thuộc tính của một Phòng chiếu.
 */
export interface IRoom {
  cinemaId: Schema.Types.ObjectId; // Tham chiếu đến Rạp chiếu phim mà phòng này thuộc về
  name: string;
  seatLayout: ISeat[];
  supportedFormats: string[]; // Ví dụ: ["2D", "3D", "IMAX"]
  status: CommonStatus; // Sử dụng enum trạng thái chung
  deleted: boolean; // Dành cho xóa mềm
  createdAt?: Date; // Tự động tạo bởi Mongoose
  updatedAt?: Date; // Tự động tạo bởi Mongoose
}

/**
 * Dùng cho cập nhật: tất cả các trường đều là tùy chọn.
 */
export type IRoomUpdate = Partial<Omit<IRoom, "createdAt" | "updatedAt" >>;

/**
 * Kiểu dữ liệu để tạo một Phòng chiếu mới.
 * Bỏ qua các trường do hệ thống tạo.
 */
export type IRoomCreate = Omit<IRoom, "createdAt" | "updatedAt" | "deleted">;