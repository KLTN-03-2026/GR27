import mongoose, { HydratedDocument, Schema, model } from "mongoose";

// Enums
export enum PaymentMethod {
  PAYOS = "PayOS",
  MOMO = "Momo",
  ZALOPAY = "ZaloPay",
  CASH = "Cash",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  EXPIRED = "expired",
}

// Interfaces
export interface IOrderSeat {
  seatKey: string;
  type: string; // standard, vip, couple
  unitPrice: number;
}

export interface IOrderComboFood {
  comboFoodId: Schema.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder {
  userId: Schema.Types.ObjectId;
  showtimeId: Schema.Types.ObjectId;
  seats: IOrderSeat[];
  comboFoods: IOrderComboFood[];
  seatSubtotal: number;
  comboSubtotal: number;
  totalAmount: number;
  ticketCode: string;
  ticketQrUrl?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  payRedirectUrl?: string;
  orderStatus: OrderStatus;
  redeemedAt?: Date;
  deleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IOrderDocument = HydratedDocument<IOrder>;

// Schema
const orderSeatSchema = new Schema<IOrderSeat>(
  {
    seatKey: { type: String, required: true },
    type: { type: String, required: true },
    unitPrice: { type: Number, required: true },
  },
  { _id: false }
);

const orderComboFoodSchema = new Schema<IOrderComboFood>(
  {
    comboFoodId: {
      type: Schema.Types.ObjectId,
      ref: "ComboFood",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    showtimeId: {
      type: Schema.Types.ObjectId,
      ref: "ShowTime",
      required: true,
    },
    seats: {
      type: [orderSeatSchema],
      required: true,
      validate: [
        (val: IOrderSeat[]) => val.length > 0,
        "Phải có ít nhất một ghế",
      ],
    },
    comboFoods: {
      type: [orderComboFoodSchema],
      default: [],
    },
    seatSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    comboSubtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
    },
    ticketQrUrl: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
      default: PaymentMethod.PAYOS,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      required: true,
      default: PaymentStatus.PENDING,
    },
    transactionId: {
      type: String,
    },
    payRedirectUrl: {
      type: String,
    },
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
      default: OrderStatus.PENDING,
    },
    redeemedAt: {
      type: Date,
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

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ showtimeId: 1 });
// orderSchema.index({ ticketCode: 1 });
orderSchema.index({ transactionId: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ deleted: 1 });

const Order = model<IOrderDocument>("Order", orderSchema, "orders");

export default Order;