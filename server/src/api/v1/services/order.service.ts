import mongoose from "mongoose";
import QRCode from "qrcode";
import Order, { OrderStatus, PaymentStatus, PaymentMethod } from "../models/order.model";
import ShowTime from "../models/showTime.model";
import ComboFood from "../models/comboFood.model";
import { ShowTimeSeatStatus } from "../../../types/showTime.type";
import { ICreateOrderPayload } from "../../../types/order.type";
import { createPaymentLink, verifyPaymentWebhookData, getPaymentLinkInformation } from "../../../helpers/payos.helper";

// ── Helpers nội bộ ────────────────────────────────────────────────────────────

const generateTicketCode = async (session: mongoose.ClientSession): Promise<string> => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");

  const latestOrder = await Order.findOne({
    ticketCode: new RegExp(`^ORD-${dateStr}-`),
    deleted: false,
  })
    .sort({ ticketCode: -1 })
    .select("ticketCode")
    .session(session);

  let sequence = 1;
  if (latestOrder?.ticketCode) {
    const lastSequence = parseInt(latestOrder.ticketCode.split("-")[2] || "0");
    sequence = lastSequence + 1;
  }

  return `ORD-${dateStr}-${String(sequence).padStart(4, "0")}`;
};

const generateOrderCode = (): number => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return Math.floor(timestamp / 1000) * 1000 + random;
};

/**
 * Cập nhật trạng thái ghế trong showtime.
 * Dùng chung cho lock (LOCKED), book (BOOKED), unlock (AVAILABLE).
 */
const updateSeatStatuses = async (
  showtimeId: mongoose.Types.ObjectId | mongoose.Schema.Types.ObjectId | string,
  seatKeys: string[],
  newStatus: ShowTimeSeatStatus
): Promise<void> => {
  const showtime = await ShowTime.findById(showtimeId.toString());
  if (!showtime) return;

  for (const seatKey of seatKeys) {
    const idx = showtime.seats.findIndex((s) => s.seatKey === seatKey);
    if (idx !== -1) showtime.seats[idx].status = newStatus;
  }
  await showtime.save();
};

// ── Service functions ────────────────────────────────────────────────────────

export const createOrder = async (userId: string, payload: ICreateOrderPayload) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { showtimeId, seats, comboFoods = [], paymentMethod = PaymentMethod.PAYOS } = payload;

    // 1. Validate showtime
    const showtime = await ShowTime.findOne({
      _id: showtimeId,
      deleted: false,
      status: "active",
    }).session(session);

    if (!showtime) throw { status: 404, message: "Không tìm thấy suất chiếu" };

    const minutesUntilStart = (showtime.startTime.getTime() - Date.now()) / (1000 * 60);
    if (minutesUntilStart < 15) {
      throw { status: 400, message: "Không thể đặt vé trong vòng 15 phút trước giờ chiếu" };
    }

    // 2. Validate & lock seats
    if (!seats || seats.length === 0) throw { status: 400, message: "Phải chọn ít nhất một ghế" };

    const seatKeys = seats.map((s) => s.seatKey);
    let seatSubtotal = 0;
    const validatedSeats: {
  seatKey: string;
  type: string;
  unitPrice: number;
  partnerSeatKey?: string;
}[] = [];
    const processedCoupleSeats = new Set<string>();

    for (const seatKey of seatKeys) {
      const seat = showtime.seats.find((s) => s.seatKey === seatKey);

      if (!seat) throw { status: 400, message: `Ghế ${seatKey} không tồn tại` };

      // Skip nếu ghế couple này đã xử lý trong cụm rồi
      if (seat.type === "couple" && seat.partnerSeatKey) {
        const coupleKey = [seatKey, seat.partnerSeatKey].sort().join("-");
        if (processedCoupleSeats.has(coupleKey)) continue;
      }

      if (seat.status !== ShowTimeSeatStatus.AVAILABLE) {
        throw { status: 400, message: `Ghế ${seatKey} đã được đặt hoặc đang bị khóa` };
      }

      const seatTypePrice = showtime.seatTypes.find((st) => st.type === seat.type);
      const actualPrice = showtime.basePrice + (seatTypePrice?.extraFee || 0);

      if (seat.type === "couple" && seat.partnerSeatKey) {
        const coupleKey = [seatKey, seat.partnerSeatKey].sort().join("-");
        processedCoupleSeats.add(coupleKey);

        const partnerSeat = showtime.seats.find((s) => s.seatKey === seat.partnerSeatKey);
        if (!partnerSeat) {
          throw { status: 400, message: `Ghế đôi ${seatKey} thiếu ghế partner ${seat.partnerSeatKey}` };
        }
        if (partnerSeat.status !== ShowTimeSeatStatus.AVAILABLE) {
          throw { status: 400, message: `Ghế đôi ${seatKey}-${seat.partnerSeatKey} không khả dụng` };
        }

        // Chỉ tính giá 1 lần cho cả cụm đôi
        seatSubtotal += actualPrice;

        validatedSeats.push({ seatKey, type: seat.type, unitPrice: actualPrice, partnerSeatKey: seat.partnerSeatKey });
        validatedSeats.push({ seatKey: seat.partnerSeatKey, type: partnerSeat.type, unitPrice: actualPrice, partnerSeatKey: seatKey });

        // Lock cả 2 ghế
        const seatIdx = showtime.seats.findIndex((s) => s.seatKey === seatKey);
        const partnerIdx = showtime.seats.findIndex((s) => s.seatKey === seat.partnerSeatKey);
        if (seatIdx !== -1) showtime.seats[seatIdx].status = ShowTimeSeatStatus.LOCKED;
        if (partnerIdx !== -1) showtime.seats[partnerIdx].status = ShowTimeSeatStatus.LOCKED;
      } else {
        seatSubtotal += actualPrice;
        validatedSeats.push({ seatKey, type: seat.type, unitPrice: actualPrice });

        const seatIdx = showtime.seats.findIndex((s) => s.seatKey === seatKey);
        if (seatIdx !== -1) showtime.seats[seatIdx].status = ShowTimeSeatStatus.LOCKED;
      }
    }

    // 3. Validate combo foods 
    let comboSubtotal = 0;
    const validatedComboFoods: {
  comboFoodId: unknown;
  name: string;
  price: number;
  quantity: number;
}[] = [];

    for (const combo of comboFoods) {
      const comboFood = await ComboFood.findOne({ _id: combo.comboFoodId, deleted: false }).session(session);
      if (!comboFood) throw { status: 404, message: `Combo ${combo.name} không tồn tại` };
      if (combo.quantity <= 0) throw { status: 400, message: "Số lượng combo phải lớn hơn 0" };

      comboSubtotal += comboFood.price * combo.quantity;
      validatedComboFoods.push({
        comboFoodId: comboFood._id,
        name: comboFood.name,
        price: comboFood.price,
        quantity: combo.quantity,
      });
    }

    const totalAmount = seatSubtotal + comboSubtotal;

    // 4. Save showtime với ghế đã lock
    await showtime.save({ session });

    // 5. Generate ticket code & tạo order
    const ticketCode = await generateTicketCode(session);
    const orderCode = generateOrderCode();

    const [order] = await Order.create(
      [
        {
          userId,
          showtimeId,
          seats: validatedSeats,
          comboFoods: validatedComboFoods,
          seatSubtotal,
          comboSubtotal,
          totalAmount,
          ticketCode,
          paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: OrderStatus.PENDING,
        },
      ],
      { session }
    );

    // 6. Tạo link thanh toán PayOS
    if (paymentMethod !== PaymentMethod.PAYOS) {
      await session.commitTransaction();
      return { orderId: order._id, ticketCode, totalAmount };
    }

    const returnUrl = `${process.env.CLIENT_URL}/payment/success?orderId=${order._id}`;
    const cancelUrl = `${process.env.CLIENT_URL}/payment/cancel?orderId=${order._id}`;

    const paymentLinkRes = await createPaymentLink(orderCode, totalAmount, ticketCode, returnUrl, cancelUrl);

    order.payRedirectUrl = paymentLinkRes.checkoutUrl;
    order.transactionId = String(orderCode);
    await order.save({ session });

    await session.commitTransaction();

    return {
      orderId: order._id,
      ticketCode,
      totalAmount,
      paymentUrl: paymentLinkRes.checkoutUrl,
      paymentData: paymentLinkRes,
      orderCode,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const handlePaymentWebhook = async (webhookBody: any) => {
  const verifiedData = await verifyPaymentWebhookData(webhookBody);
  if (!verifiedData) throw { status: 400, message: "Invalid webhook signature" };

  const { code, desc, orderCode   } = verifiedData;

  if (orderCode === 123) {
    return { alreadyProcessed: true }; // hoặc return { isTest: true }
  }

  const order = await Order.findOne({ transactionId: String(orderCode) });

  if (!order) throw { status: 404, message: "Order not found" };

  // Idempotency — tránh xử lý lại
  if (order.paymentStatus === PaymentStatus.PAID) return { alreadyProcessed: true };
  if (order.orderStatus === OrderStatus.CANCELLED || order.orderStatus === OrderStatus.EXPIRED) {
    return { alreadyProcessed: true };
  }

  const seatKeys = order.seats.map((s) => s.seatKey);

  if (code === "00") {
    // Thanh toán thành công
    order.paymentStatus = PaymentStatus.PAID;
    order.orderStatus = OrderStatus.CONFIRMED;
    order.ticketQrUrl = await QRCode.toDataURL(
      JSON.stringify({ ticketCode: order.ticketCode, orderId: order._id.toString() })
    );
    await order.save();
    await updateSeatStatuses(order.showtimeId, seatKeys, ShowTimeSeatStatus.BOOKED);
  } else {
    // Thanh toán thất bại
    order.paymentStatus = PaymentStatus.FAILED;
    order.orderStatus = OrderStatus.CANCELLED;
    await order.save();
    await updateSeatStatuses(order.showtimeId, seatKeys, ShowTimeSeatStatus.AVAILABLE);
  }

  return { alreadyProcessed: false, desc };
};

export const checkPaymentStatus = async (orderId: string, userId: string) => {
  const order = await Order.findOne({ _id: orderId, userId, deleted: false });
  if (!order) throw { status: 404, message: "Không tìm thấy đơn hàng" };

  if (order.paymentStatus === PaymentStatus.PAID) {
    return { status: "PAID", paymentStatus: order.paymentStatus, orderStatus: order.orderStatus };
  }

  if (!order.transactionId) {
    return { status: "PENDING", paymentStatus: order.paymentStatus, orderStatus: order.orderStatus };
  }

  const paymentInfo = await getPaymentLinkInformation(Number(order.transactionId));
  const seatKeys = order.seats.map((s) => s.seatKey);

  if (paymentInfo.status === "PAID") {
    order.paymentStatus = PaymentStatus.PAID;
    order.orderStatus = OrderStatus.CONFIRMED;
    order.ticketQrUrl = await QRCode.toDataURL(
      JSON.stringify({ ticketCode: order.ticketCode, orderId: order._id.toString() })
    );
    await order.save();
    await updateSeatStatuses(order.showtimeId, seatKeys, ShowTimeSeatStatus.BOOKED);

    return { status: "PAID", paymentStatus: order.paymentStatus, orderStatus: order.orderStatus, ticketQrUrl: order.ticketQrUrl };
  }

  if (paymentInfo.status === "CANCELLED" || paymentInfo.status === "EXPIRED") {
    order.paymentStatus = PaymentStatus.FAILED;
    order.orderStatus = OrderStatus.CANCELLED;
    await order.save();
    await updateSeatStatuses(order.showtimeId, seatKeys, ShowTimeSeatStatus.AVAILABLE);

    return { status: "CANCELLED", paymentStatus: order.paymentStatus, orderStatus: order.orderStatus };
  }

  return {
    status: "PENDING",
    paymentStatus: PaymentStatus.PENDING,
    orderStatus: OrderStatus.PENDING,
    paymentInfo: { status: paymentInfo.status, amount: paymentInfo.amount },
  };
};

export const cancelOrder = async (orderId: string, userId: string) => {
  const order = await Order.findOne({ _id: orderId, userId, deleted: false });
  if (!order) throw { status: 404, message: "Không tìm thấy đơn hàng" };

  if (order.paymentStatus === PaymentStatus.PAID) {
    throw { status: 400, message: "Không thể hủy đơn hàng đã thanh toán. Vui lòng liên hệ hỗ trợ." };
  }
  if (order.orderStatus === OrderStatus.CANCELLED) {
    throw { status: 400, message: "Đơn hàng đã bị hủy trước đó" };
  }

  const seatKeys = order.seats.map((s) => s.seatKey);
  await updateSeatStatuses(order.showtimeId, seatKeys, ShowTimeSeatStatus.AVAILABLE);

  order.orderStatus = OrderStatus.CANCELLED;
  order.paymentStatus = PaymentStatus.FAILED;
  await order.save();
};

export interface IGetOrdersAdminQuery {
  page?: number;
  limit?: number;
  search?: string;
  orderStatus?: string;
  paymentStatus?: string;
  filmId?: string;
  cinemaId?: string;
  startDate?: string;
  endDate?: string;
}

export const getOrdersAdmin = async ({
  page = 1, limit = 10, search, orderStatus, paymentStatus,
  filmId, cinemaId, startDate, endDate,
}: IGetOrdersAdminQuery) => {
  const skip = (page - 1) * limit;
  const query: any = { deleted: false };

  if (search?.trim()) query.ticketCode = { $regex: search.trim(), $options: "i" };
  if (orderStatus && orderStatus !== "all") query.orderStatus = orderStatus;
  if (paymentStatus && paymentStatus !== "all") query.paymentStatus = paymentStatus;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) { const s = new Date(startDate); s.setHours(0, 0, 0, 0); query.createdAt.$gte = s; }
    if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59, 999); query.createdAt.$lte = e; }
  }

  // Filter by film hoặc cinema qua showtime
  if (filmId && filmId !== "all") {
    const ids = await ShowTime.find({ filmId, deleted: false }).distinct("_id");
    query.showtimeId = { $in: ids };
  }

  if (cinemaId && cinemaId !== "all") {
    const ids = await ShowTime.find({ cinemaId, deleted: false }).distinct("_id");
    if (query.showtimeId) {
      // Giao của 2 tập
      const existing = query.showtimeId.$in.map((id: any) => id.toString());
      const newIds = ids.map((id) => id.toString());
      query.showtimeId = { $in: existing.filter((id: string) => newIds.includes(id)) };
    } else {
      query.showtimeId = { $in: ids };
    }
  }

  const [total, orders] = await Promise.all([
    Order.countDocuments(query),
    Order.find(query)
      .populate({ path: "userId", select: "username email phone" })
      .populate({
        path: "showtimeId",
        select: "filmId cinemaId roomId startTime endTime format basePrice",
        populate: [
          { path: "filmId", select: "title thumbnail duration ageRating" },
          { path: "cinemaId", select: "name address city" },
          { path: "roomId", select: "name roomType" },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return { orders, total, page, limit };
};

export const getOrderDetailAdmin = async (id: string) => {
  const order = await Order.findOne({ _id: id, deleted: false })
    .populate({ path: "userId", select: "username email phone avatar" })
    .populate({
      path: "showtimeId",
      populate: [
        { path: "filmId", select: "title thumbnail duration ageRating genres director cast" },
        { path: "cinemaId", select: "name address city phone email" },
        { path: "roomId", select: "name roomType capacity" },
      ],
    })
    .lean();

  if (!order) throw { status: 404, message: "Không tìm thấy đơn hàng" };
  return order;
};

export const getMyOrders = async (userId: string, page = 1, orderStatus?: string, filmId?: string) => {
  const limit = 10;
  const skip = (page - 1) * limit;

  const query: any = { userId, deleted: false };

  if (orderStatus && orderStatus !== "all") {
    query.orderStatus = orderStatus;
  } else if (!orderStatus) {
    query.orderStatus = OrderStatus.CONFIRMED;
  }

  if (filmId && filmId !== "all") {
    const ids = await ShowTime.find({ filmId }).distinct("_id");
    query.showtimeId = { $in: ids };
  }

  const [total, orders] = await Promise.all([
    Order.countDocuments(query),
    Order.find(query)
      .populate({
        path: "showtimeId",
        select: "filmId cinemaId roomId startTime endTime format",
        populate: [
          { path: "filmId", select: "title thumbnail" },
          { path: "cinemaId", select: "name address" },
          { path: "roomId", select: "name" },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return { orders, total, page, limit };
};

export const getOrderDetail = async (orderId: string, userId: string) => {
  const order = await Order.findOne({ _id: orderId, userId, deleted: false }).populate({
    path: "showtimeId",
    populate: [
      { path: "filmId", select: "title thumbnail duration ageRating" },
      { path: "cinemaId", select: "name address" },
      { path: "roomId", select: "name" },
    ],
  });

  if (!order) throw { status: 404, message: "Không tìm thấy đơn hàng" };
  return order;
};