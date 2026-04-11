import mongoose, { HydratedDocument, Schema, model } from "mongoose";
import { IShowTime, IShowTimeSeat, IShowTimeSeatTypePrice, ShowTimeSeatStatus } from "../../../types/showTime.type";
import { CommonStatus } from "../../../types/common.type";
import { SeatType } from "../../../types/room.type";

export type IShowTimeDocument = HydratedDocument<IShowTime>;

/**
 * Schema cho phụ phí theo loại ghế.
 */
const showTimeSeatTypePriceSchema = new Schema<IShowTimeSeatTypePrice>({
  type: {
    type: String,
    enum: Object.values(SeatType),
    required: true,
  },
  extraFee: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  _id: false
});

/**
 * Schema cho trạng thái của từng ghế trong suất chiếu.
 */
const showTimeSeatSchema = new Schema<IShowTimeSeat>({
  row: { type: String, required: true },
  number: { type: Number, required: true },
  type: {
    type: String,
    enum: Object.values(SeatType),
    required: true,
  },
  seatKey: { type: String, required: true },
  partnerSeatKey: { type: String },
  status: {
    type: String,
    enum: Object.values(ShowTimeSeatStatus),
    required: true,
    default: ShowTimeSeatStatus.AVAILABLE,
  },
}, {
  _id: false
});


/**
 * Schema chính cho Suất chiếu.
 */
const showTimeSchema = new Schema<IShowTimeDocument>(
  {
    filmId: {
      type: Schema.Types.ObjectId,
      ref: "Film",
      required: true,
    },
    cinemaId: {
      type: Schema.Types.ObjectId,
      ref: "Cinema",
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    format: {
      type: String,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    seatTypes: {
      type: [showTimeSeatTypePriceSchema],
      required: true,
    },
    seats: {
      type: [showTimeSeatSchema],
      required: true,
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
    timestamps: true,
    versionKey: false,
  }
);

// Tối ưu hóa truy vấn
showTimeSchema.index({ filmId: 1, cinemaId: 1, startTime: 1 });
showTimeSchema.index({ roomId: 1, startTime: 1 });
showTimeSchema.index({ startTime: 1 });
showTimeSchema.index({ status: 1 });
showTimeSchema.index({ deleted: 1 });


const ShowTime = model<IShowTimeDocument>("ShowTime", showTimeSchema, "showtimes");

export default ShowTime;