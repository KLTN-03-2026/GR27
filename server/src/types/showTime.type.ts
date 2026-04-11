import { Schema } from "mongoose";
import { CommonStatus } from "./common.type";
// ✅ Import ISeat và SeatType để tái sử dụng
import { ISeat, SeatType } from "./room.type";

/**
 * Enum cho trạng thái của một ghế trong suất chiếu cụ thể.
 */
export enum ShowTimeSeatStatus {
  AVAILABLE = "available", // Ghế trống
  BOOKED = "booked",       // Ghế đã được đặt
  LOCKED = "locked",       // Ghế đang trong quá trình giao dịch
}

/**
 * Kiểu dữ liệu cho một đối tượng ghế trong mảng `seats` của suất chiếu.
 * Nó bao gồm toàn bộ thuộc tính của ISeat và thêm trạng thái (status).
 * Sử dụng Type Intersection (&) của TypeScript để kết hợp hai kiểu dữ liệu.
 */
export type IShowTimeSeat = ISeat & {
  status: ShowTimeSeatStatus;
};

/**
 * Interface cho đối tượng định nghĩa phụ phí theo loại ghế.
 */
export interface IShowTimeSeatTypePrice {
  type: SeatType;
  extraFee: number;
}

/**
 * Định nghĩa các thuộc tính cốt lõi của một Suất chiếu.
 */
export interface IShowTime {
  filmId: Schema.Types.ObjectId;
  cinemaId: Schema.Types.ObjectId;
  roomId: Schema.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  format: string; // Ví dụ: "2D", "3D"
  basePrice: number;
  seatTypes: IShowTimeSeatTypePrice[];
  seats: IShowTimeSeat[]; 
  status: CommonStatus;
  deleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Kiểu dữ liệu dùng để cập nhật một Suất chiếu.
 * CHỈ CHO PHÉP sửa: format, basePrice, seatTypes, startTime, endTime, status
 * KHÔNG CHO PHÉP sửa: filmId, cinemaId, roomId, seats
 */
export type IShowTimeUpdate = Partial<
  Omit<IShowTime, 
    "createdAt" | 
    "updatedAt" | 
       
    "deleted"       
  >
>;

/**
 * Kiểu dữ liệu để tạo một Suất chiếu mới.
 * Bỏ qua các trường do hệ thống tạo.
 */
export type IShowTimeCreate = Omit<IShowTime, "createdAt" | "updatedAt" | "deleted">;