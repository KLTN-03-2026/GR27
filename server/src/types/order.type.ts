import { Schema } from "mongoose";
import { PaymentMethod, PaymentStatus, OrderStatus } from "../api/v1/models/order.model";

export interface IOrderSeatCreate {
  seatKey: string;
  type: string;
  unitPrice: number;
}

export interface IOrderComboFoodCreate {
  comboFoodId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ICreateOrderPayload {
  showtimeId: string;
  seats: IOrderSeatCreate[];
  comboFoods?: IOrderComboFoodCreate[];
  paymentMethod?: PaymentMethod;
}

export interface ICreateOrderResponse {
  orderId: string;
  ticketCode: string;
  totalAmount: number;
  paymentUrl?: string; // URL thanh toán từ PayOS
  orderCode: number; // orderCode từ PayOS
}

export interface IPayOSWebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
}

export { PaymentMethod, PaymentStatus, OrderStatus };