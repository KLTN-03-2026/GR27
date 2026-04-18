import { Request, Response } from "express";
import Order, {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from "../models/order.model";
import ShowTime from "../models/showTime.model";
import ComboFood from "../models/comboFood.model";
import { ShowTimeSeatStatus } from "../../../types/showTime.type";
import { ICreateOrderPayload } from "../../../types/order.type";
import Showtime from '../models/showTime.model'; // Điều chỉnh path cho đúng
import {
  createPaymentLink,
  verifyPaymentWebhookData,
} from "../../../helpers/payos.helper";
import QRCode from "qrcode";
import mongoose from "mongoose";

/**
 * Generate ticket code: ORD-YYYYMMDD-XXXX
 */
/**
 * Generate ticket code: ORD-YYYYMMDD-XXXX
 */
const generateTicketCode = async (): Promise<string> => {
  const now = new Date();

  // Tạo một đối tượng Date mới cho đầu ngày mà không làm thay đổi 'now'
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Tạo một đối tượng Date mới cho cuối ngày mà không làm thay đổi 'now'
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Lấy chuỗi ngày tháng từ 'now' gốc
  const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");

  // Đếm số đơn hàng được tạo trong khoảng thời gian chính xác của ngày hôm nay
  const count = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `ORD-${dateStr}-${sequence}`;
};


/**
 * [POST] CREATE ORDER: /api/v1/orders
 */
export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user!._id;
    const payload = req.body as ICreateOrderPayload;

    const {
      showtimeId,
      seats,
      comboFoods = [],
      paymentMethod = PaymentMethod.PAYOS,
    } = payload;

    // 1. Validate showtime
    const showtime = await ShowTime.findOne({
      _id: showtimeId,
      deleted: false,
      status: "active",
    }).session(session);

    if (!showtime) {
      await session.abortTransaction();
      res.status(404).json({ code: 404, message: "Không tìm thấy suất chiếu" });
      return;
    }

    // Kiểm tra thời gian
    const now = new Date();
    const timeUntilStart = showtime.startTime.getTime() - now.getTime();
    const minutesUntilStart = timeUntilStart / (1000 * 60);

    if (minutesUntilStart < 15) {
      await session.abortTransaction();
      res.status(400).json({
        code: 400,
        message: "Không thể đặt vé trong vòng 15 phút trước giờ chiếu",
      });
      return;
    }

    // 2. Validate seats
    if (!seats || seats.length === 0) {
      await session.abortTransaction();
      res.status(400).json({ code: 400, message: "Phải chọn ít nhất một ghế" });
      return;
    }

    const seatKeys = seats.map((s) => s.seatKey);
    let seatSubtotal = 0;
    const validatedSeats = [];
    const processedCoupleSeats = new Set<string>(); // Track ghế đôi đã xử lý

    for (const seatKey of seatKeys) {
      const seat = showtime.seats.find((s) => s.seatKey === seatKey);

      if (!seat) {
        await session.abortTransaction();
        res.status(400).json({
          code: 400,
          message: `Ghế ${seatKey} không tồn tại`,
        });
        return;
      }

      // ✅ CHECK TRƯỚC: Nếu ghế này thuộc cụm couple đã xử lý rồi thì skip
      if (seat.type === 'couple' && seat.partnerSeatKey) {
        const coupleKey = [seatKey, seat.partnerSeatKey].sort().join('-');
        if (processedCoupleSeats.has(coupleKey)) {
          continue; // Skip vì đã xử lý cụm này rồi
        }
      }

      if (seat.status !== ShowTimeSeatStatus.AVAILABLE) {
        await session.abortTransaction();
        res.status(400).json({
          code: 400,
          message: `Ghế ${seatKey} đã được đặt hoặc đang bị khóa`,
        });
        return;
      }

      // Tính giá
      const seatTypePrice = showtime.seatTypes.find(
        (st) => st.type === seat.type
      );
      const actualPrice = showtime.basePrice + (seatTypePrice?.extraFee || 0);

      //  XỬ LÝ GHẾ ĐÔI - CHỈ TÍNH GIÁ 1 LẦN CHO CẢ CỤM
      if (seat.type === 'couple' && seat.partnerSeatKey) {
        // Tạo unique key cho cụm ghế đôi (sort để đảm bảo thứ tự nhất quán)
        const coupleKey = [seatKey, seat.partnerSeatKey].sort().join('-');
        
        // Nếu đã xử lý cụm ghế đôi này rồi thì skip
        if (processedCoupleSeats.has(coupleKey)) {
          continue;
        }
        
        // Đánh dấu đã xử lý cụm này
        processedCoupleSeats.add(coupleKey);
        
        // Validate ghế partner phải tồn tại và available (KHÔNG cần check có trong seatKeys)
        const partnerSeat = showtime.seats.find((s) => s.seatKey === seat.partnerSeatKey);
        
        if (!partnerSeat) {
          await session.abortTransaction();
          res.status(400).json({
            code: 400,
            message: `Ghế đôi ${seatKey} thiếu ghế partner ${seat.partnerSeatKey}`,
          });
          return;
        }

        if (partnerSeat.status !== ShowTimeSeatStatus.AVAILABLE) {
          await session.abortTransaction();
          res.status(400).json({
            code: 400,
            message: `Ghế đôi ${seatKey}-${seat.partnerSeatKey} không khả dụng`,
          });
          return;
        }

        //  CHỈ TÍNH GIÁ 1 LẦN CHO CẢ CỤM GHẾ ĐÔI
        seatSubtotal += actualPrice;
        
        //  LƯU CẢ 2 GHẾ TRONG CỤM VÀO DATABASE
        validatedSeats.push({
          seatKey,
          type: seat.type,
          unitPrice: actualPrice,
          partnerSeatKey: seat.partnerSeatKey,
        });
        
        validatedSeats.push({
          seatKey: seat.partnerSeatKey,
          type: partnerSeat.type,
          unitPrice: actualPrice,
          partnerSeatKey: seatKey,
        });

        // Lock CẢ 2 ghế trong cụm
        const seatIndex = showtime.seats.findIndex((s) => s.seatKey === seatKey);
        const partnerIndex = showtime.seats.findIndex((s) => s.seatKey === seat.partnerSeatKey);
        
        if (seatIndex !== -1) {
          showtime.seats[seatIndex].status = ShowTimeSeatStatus.LOCKED;
        }
        if (partnerIndex !== -1) {
          showtime.seats[partnerIndex].status = ShowTimeSeatStatus.LOCKED;
        }
      } else {
        // Ghế thường - tính giá bình thường
        seatSubtotal += actualPrice;
        
        validatedSeats.push({
          seatKey,
          type: seat.type,
          unitPrice: actualPrice,
        });

        // Lock ghế
        const seatIndex = showtime.seats.findIndex((s) => s.seatKey === seatKey);
        if (seatIndex !== -1) {
          showtime.seats[seatIndex].status = ShowTimeSeatStatus.LOCKED;
        }
      }
    }

    // 3. Validate combo foods
    let comboSubtotal = 0;
    const validatedComboFoods = [];

    if (comboFoods.length > 0) {
      for (const combo of comboFoods) {
        const comboFood = await ComboFood.findOne({
          _id: combo.comboFoodId,
          deleted: false,
        }).session(session);

        if (!comboFood) {
          await session.abortTransaction();
          res.status(404).json({
            code: 404,
            message: `Combo ${combo.name} không tồn tại`,
          });
          return;
        }

        if (combo.quantity <= 0) {
          await session.abortTransaction();
          res.status(400).json({
            code: 400,
            message: "Số lượng combo phải lớn hơn 0",
          });
          return;
        }

        const actualPrice = comboFood.price;
        comboSubtotal += actualPrice * combo.quantity;
        
        validatedComboFoods.push({
          comboFoodId: comboFood._id,
          name: comboFood.name,
          price: actualPrice,
          quantity: combo.quantity,
        });
      }
    }

    const totalAmount = seatSubtotal + comboSubtotal;

    // 4. Save showtime với ghế đã lock
    await showtime.save({ session });

    // 5. Generate ticket code trong transaction
    const now2 = new Date();
    const dateStr = now2.toISOString().split("T")[0].replace(/-/g, "");

    // Tìm số thứ tự lớn nhất trong ngày
    const latestOrder = await Order.findOne({
      ticketCode: new RegExp(`^ORD-${dateStr}-`),
      deleted: false,
    })
      .sort({ ticketCode: -1 })
      .select("ticketCode")
      .session(session);

    let sequence = 1;
    if (latestOrder && latestOrder.ticketCode) {
      const lastSequence = parseInt(
        latestOrder.ticketCode.split("-")[2] || "0"
      );
      sequence = lastSequence + 1;
    }

    const ticketCode = `ORD-${dateStr}-${String(sequence).padStart(4, "0")}`;
    const orderCode = generateOrderCode();

    // 6. Tạo order
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

    // 7. Tạo link thanh toán PayOS
    let paymentUrl = "";
    let paymentLinkRes = null;

    if (paymentMethod === PaymentMethod.PAYOS) {
      try {
        const returnUrl = `${process.env.CLIENT_URL}/payment/success?orderId=${order._id}`;
        const cancelUrl = `${process.env.CLIENT_URL}/payment/cancel?orderId=${order._id}`;

        paymentLinkRes = await createPaymentLink(
          orderCode,
          totalAmount,
          `${ticketCode}`,
          returnUrl,
          cancelUrl
        );

        console.log("PayOS Response Object:", JSON.stringify(paymentLinkRes, null, 2));

        paymentUrl = paymentLinkRes.checkoutUrl;

        // Update order với thông tin thanh toán
        order.payRedirectUrl = paymentUrl;
        order.transactionId = String(orderCode);
        await order.save({ session });
      } catch (error) {
        console.error("PayOS create payment link error:", error);
        await session.abortTransaction();

        res.status(500).json({
          code: 500,
          message: "Không thể tạo link thanh toán",
        });
        return;
      }
    }

    // ✅ Commit transaction nếu mọi thứ OK
    await session.commitTransaction();

    if (paymentLinkRes) {
      res.status(201).json({
        code: 201,
        message: "Tạo đơn hàng thành công",
        data: {
          orderId: order._id,
          ticketCode: order.ticketCode,
          totalAmount: order.totalAmount,
          paymentUrl,
          paymentData: paymentLinkRes,
          orderCode,
        },
      });
    } else {
      console.error("paymentLinkRes is null");
      res.status(500).json({ message: "Lỗi server" });
    }
  } catch (error) {
    await session.abortTransaction();
    console.error("Create order error:", error);
    res.status(500).json({ message: "Lỗi server" });
  } finally {
    session.endSession();
  }
};

/**
 * Generate unique orderCode for PayOS
 */
const generateOrderCode = (): number => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return Math.floor(timestamp / 1000) * 1000 + random;
};

/**
 * [POST] WEBHOOK FROM PAYOS: /api/v1/orders/webhook
 */
export const paymentWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const webhookData = req.body;

    // Verify webhook signature
    const verifiedData = await verifyPaymentWebhookData(webhookData);

    if (!verifiedData) {
      res.status(400).json({ code: 400, message: "Invalid webhook signature" });
      return;
    }

    // Sử dụng verifiedData thay vì webhookData
    const { code, desc } = verifiedData;

    // Tìm order theo transactionId (orderCode)
    const order = await Order.findOne({ transactionId: String(code) });

    if (!order) {
      console.error(`Order not found for orderCode: ${code}`);
      res.status(404).json({ code: 404, message: "Order not found" });
      return;
    }

    // ✅ FIX: Kiểm tra trạng thái đơn hàng để tránh xử lý lại
    if (order.paymentStatus === PaymentStatus.PAID) {
      console.log(`Order ${order.ticketCode} already paid, skipping webhook`);
      res.status(200).json({ 
        code: 200, 
        message: "Webhook already processed" 
      });
      return;
    }

    if (order.orderStatus === OrderStatus.CANCELLED || 
        order.orderStatus === OrderStatus.EXPIRED) {
      console.log(`Order ${order.ticketCode} already cancelled/expired, skipping webhook`);
      res.status(200).json({ 
        code: 200, 
        message: "Order already cancelled/expired" 
      });
      return;
    }

    // Kiểm tra trạng thái thanh toán
    if (code === "00") {
      // Thanh toán thành công
      order.paymentStatus = PaymentStatus.PAID;
      order.orderStatus = OrderStatus.CONFIRMED;

      // Generate QR code
      const qrData = JSON.stringify({
        ticketCode: order.ticketCode,
        orderId: order._id.toString(),
      });

      const qrCodeUrl = await QRCode.toDataURL(qrData);
      order.ticketQrUrl = qrCodeUrl;

      // Lock seats permanently (BOOKED)
      const showtime = await ShowTime.findById(order.showtimeId);
      if (showtime) {
        const seatKeys = order.seats.map((s) => s.seatKey);
        for (const seatKey of seatKeys) {
          const seatIndex = showtime.seats.findIndex(
            (s) => s.seatKey === seatKey
          );
          if (seatIndex !== -1) {
            showtime.seats[seatIndex].status = ShowTimeSeatStatus.BOOKED;
          }
        }
        await showtime.save();
      }

      await order.save();

      console.log(`✅ Payment successful for order ${order.ticketCode}`);
    } else {
      // Thanh toán thất bại
      order.paymentStatus = PaymentStatus.FAILED;
      order.orderStatus = OrderStatus.CANCELLED;
      await order.save();

      // Unlock seats
      const showtime = await ShowTime.findById(order.showtimeId);
      if (showtime) {
        const seatKeys = order.seats.map((s) => s.seatKey);
        for (const seatKey of seatKeys) {
          const seatIndex = showtime.seats.findIndex(
            (s) => s.seatKey === seatKey
          );
          if (seatIndex !== -1) {
            showtime.seats[seatIndex].status = ShowTimeSeatStatus.AVAILABLE;
          }
        }
        await showtime.save();
      }

      console.log(`❌ Payment failed for order ${order.ticketCode}: ${desc}`);
    }

    res.status(200).json({ code: 200, message: "Webhook processed" });
  } catch (error) {
    console.error("Payment webhook error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [GET] MY ORDERS: /api/v1/orders/me
 */
export const getMyOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const query: any = { 
      userId, 
      deleted: false,
    };

    // Lọc theo orderStatus
    const statusFilter = req.query.orderStatus as string;
    if (statusFilter && statusFilter !== 'all') {
      query.orderStatus = statusFilter;
    } else if (!statusFilter) {
      query.orderStatus = OrderStatus.CONFIRMED;
    }

    // ✅ THÊM MỚI: Lọc theo filmId
    const filmIdFilter = req.query.filmId as string;
    if (filmIdFilter && filmIdFilter !== 'all') {
      // Lấy danh sách showtimeId có filmId tương ứng
      const showtimes = await Showtime.find({ filmId: filmIdFilter }).select('_id');
      const showtimeIds = showtimes.map(st => st._id);
      query.showtimeId = { $in: showtimeIds };
    }

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
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
      .limit(limit);

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [GET] ORDER DETAIL: /api/v1/orders/:id
 */
export const getOrderDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const order = await Order.findOne({
      _id: id,
      userId,
      deleted: false,
    }).populate({
      path: "showtimeId",
      populate: [
        { path: "filmId", select: "title thumbnail duration ageRating" },
        { path: "cinemaId", select: "name address" },
        { path: "roomId", select: "name" },
      ],
    });

    if (!order) {
      res.status(404).json({ code: 404, message: "Không tìm thấy đơn hàng" });
      return;
    }

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: order,
    });
  } catch (error) {
    console.error("Get order detail error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [GET] CHECK PAYMENT STATUS: /api/v1/orders/:id/check-payment
 * ✅ API này dùng để check trạng thái thanh toán từ PayOS
 * Dùng khi test local không có webhook
 */
export const checkPaymentStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const order = await Order.findOne({
      _id: id,
      userId,
      deleted: false,
    });

    if (!order) {
      res.status(404).json({ code: 404, message: "Không tìm thấy đơn hàng" });
      return;
    }

    // Nếu đã thanh toán rồi thì không cần check nữa
    if (order.paymentStatus === PaymentStatus.PAID) {
      res.status(200).json({
        code: 200,
        message: "Đơn hàng đã được thanh toán",
        data: {
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
        },
      });
      return;
    }

    // Gọi API PayOS để check trạng thái
    if (order.transactionId) {
      try {
        const { getPaymentLinkInformation } = await import(
          "../../../helpers/payos.helper.js"
        );
        
        const paymentInfo = await getPaymentLinkInformation(
          Number(order.transactionId)
        );

         

        // Check status từ PayOS
        if (paymentInfo.status === "PAID") {
          
          // Thanh toán thành công
          order.paymentStatus = PaymentStatus.PAID;
          order.orderStatus = OrderStatus.CONFIRMED;

          // Generate QR code
          const qrData = JSON.stringify({
            ticketCode: order.ticketCode,
            orderId: order._id.toString(),
          });

          const qrCodeUrl = await QRCode.toDataURL(qrData);
          order.ticketQrUrl = qrCodeUrl;

          // Lock seats permanently (BOOKED)
          const showtime = await ShowTime.findById(order.showtimeId);
          if (showtime) {
            const seatKeys = order.seats.map((s) => s.seatKey);
            for (const seatKey of seatKeys) {
              const seatIndex = showtime.seats.findIndex(
                (s) => s.seatKey === seatKey
              );
              if (seatIndex !== -1) {
                showtime.seats[seatIndex].status = ShowTimeSeatStatus.BOOKED;
              }
            }
            await showtime.save();
          }

          await order.save();
          
          res.status(200).json({
            code: 200,
            message: "Thanh toán thành công",
            data: {
              paymentStatus: order.paymentStatus,
              orderStatus: order.orderStatus,
              ticketQrUrl: order.ticketQrUrl,
            },
          });
          return;
        } else if (
          paymentInfo.status === "CANCELLED" ||
          paymentInfo.status === "EXPIRED"
        ) {
          // Thanh toán thất bại hoặc hủy
          order.paymentStatus = PaymentStatus.FAILED;
          order.orderStatus = OrderStatus.CANCELLED;
          await order.save();

          // Unlock seats
          const showtime = await ShowTime.findById(order.showtimeId);
          if (showtime) {
            const seatKeys = order.seats.map((s) => s.seatKey);
            for (const seatKey of seatKeys) {
              const seatIndex = showtime.seats.findIndex(
                (s) => s.seatKey === seatKey
              );
              if (seatIndex !== -1) {
                showtime.seats[seatIndex].status = ShowTimeSeatStatus.AVAILABLE;
              }
            }
            await showtime.save();
          }

          res.status(200).json({
            code: 200,
            message: "Thanh toán thất bại hoặc đã hủy",
            data: {
              paymentStatus: order.paymentStatus,
              orderStatus: order.orderStatus,
            },
          });
          return;
        } else {
          // PENDING - đang chờ thanh toán
          res.status(200).json({
            code: 200,
            message: "Đơn hàng đang chờ thanh toán",
            data: {
              paymentStatus: PaymentStatus.PENDING,
              orderStatus: OrderStatus.PENDING,
              paymentInfo: {
                status: paymentInfo.status,
                amount: paymentInfo.amount,
              },
            },
          });
          return;
        }
      } catch (error) {
        console.error("Check PayOS payment error:", error);
        res.status(500).json({
          code: 500,
          message: "Không thể kiểm tra trạng thái thanh toán",
        });
        return;
      }
    }

    // Nếu không có transactionId
    res.status(200).json({
      code: 200,
      message: "Đơn hàng đang chờ thanh toán",
      data: {
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error("Check payment status error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [PATCH] CANCEL ORDER: /api/v1/orders/:id/cancel
 */
export const cancelOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const order = await Order.findOne({
      _id: id,
      userId,
      deleted: false,
    });

    if (!order) {
      res.status(404).json({ code: 404, message: "Không tìm thấy đơn hàng" });
      return;
    }

    // Chỉ cho phép hủy nếu chưa thanh toán hoặc đang pending
    if (order.paymentStatus === PaymentStatus.PAID) {
      res.status(400).json({
        code: 400,
        message:
          "Không thể hủy đơn hàng đã thanh toán. Vui lòng liên hệ hỗ trợ.",
      });
      return;
    }

    if (order.orderStatus === OrderStatus.CANCELLED) {
      res.status(400).json({
        code: 400,
        message: "Đơn hàng đã bị hủy trước đó",
      });
      return;
    }

    // Unlock seats
    const showtime = await ShowTime.findById(order.showtimeId);
    if (showtime) {
      const seatKeys = order.seats.map((s) => s.seatKey);
      for (const seatKey of seatKeys) {
        const seatIndex = showtime.seats.findIndex(
          (s) => s.seatKey === seatKey
        );
        if (seatIndex !== -1) {
          showtime.seats[seatIndex].status = ShowTimeSeatStatus.AVAILABLE;
        }
      }
      await showtime.save();
    }

    // Update order status
    order.orderStatus = OrderStatus.CANCELLED;
    order.paymentStatus = PaymentStatus.FAILED;
    await order.save();

    res.status(200).json({
      code: 200,
      message: "Hủy đơn hàng thành công",
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};


/**
 * [GET] ALL ORDERS (ADMIN): /api/v1/orders/admin
 * Query params:
 * - page: số trang (mặc định 1)
 * - limit: số item/trang (mặc định 20)
 * - search: tìm theo mã đơn hàng (ticketCode)
 * - orderStatus: lọc theo trạng thái đơn (all/pending/confirmed/cancelled/refunded/expired)
 * - paymentStatus: lọc theo trạng thái thanh toán (all/pending/paid/failed/refunded)
 * - filmId: lọc theo phim
 * - cinemaId: lọc theo rạp
 * - startDate: lọc từ ngày (YYYY-MM-DD)
 * - endDate: lọc đến ngày (YYYY-MM-DD)
 */
export const index = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { deleted: false };

    // Search by ticket code
    const search = req.query.search as string;
    if (search && search.trim()) {
      query.ticketCode = { $regex: search.trim(), $options: "i" };
    }

    // Filter by order status
    const orderStatus = req.query.orderStatus as string;
    if (orderStatus && orderStatus !== "all") {
      query.orderStatus = orderStatus;
    }

    // Filter by payment status
    const paymentStatus = req.query.paymentStatus as string;
    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus;
    }

    // Filter by date range
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Filter by film or cinema (cần populate showtime trước)
    const filmId = req.query.filmId as string;
    const cinemaId = req.query.cinemaId as string;
    
    if (filmId && filmId !== "all") {
      const showtimes = await Showtime.find({ 
        filmId: filmId,
        deleted: false 
      }).select("_id");
      const showtimeIds = showtimes.map(st => st._id);
      query.showtimeId = { $in: showtimeIds };
    }
    
    if (cinemaId && cinemaId !== "all") {
      const showtimes = await Showtime.find({ 
        cinemaId: cinemaId,
        deleted: false 
      }).select("_id");
      const showtimeIds = showtimes.map(st => st._id);
      
      // Nếu đã có filter filmId thì kết hợp
      if (query.showtimeId) {
        const existingIds = query.showtimeId.$in.map((id: any) => id.toString());
        const newIds = showtimeIds.map(id => id.toString());
        const intersectionIds = existingIds.filter((id: string) => newIds.includes(id));
        query.showtimeId = { $in: intersectionIds };
      } else {
        query.showtimeId = { $in: showtimeIds };
      }
    }

    // Count total
    const total = await Order.countDocuments(query);

    // Get orders with populate
    const orders = await Order.find(query)
      .populate({
        path: "userId",
        select: "username email phone",
      })
      .populate({
        path: "showtimeId",
        select: "filmId cinemaId roomId startTime endTime format basePrice",
        populate: [
          { 
            path: "filmId", 
            select: "title thumbnail duration ageRating" 
          },
          { 
            path: "cinemaId", 
            select: "name address city" 
          },
          { 
            path: "roomId", 
            select: "name roomType" 
          },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      code: 200,
      message: "Lấy danh sách đơn hàng thành công",
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all orders (admin) error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [GET] ORDER DETAIL (ADMIN): /api/v1/orders/admin/:id
 */
export const getOrderDetailAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      deleted: false,
    })
      .populate({
        path: "userId",
        select: "username email phone avatar",
      })
      .populate({
        path: "showtimeId",
        populate: [
          { 
            path: "filmId", 
            select: "title thumbnail duration ageRating genres director cast" 
          },
          { 
            path: "cinemaId", 
            select: "name address city phone email" 
          },
          { 
            path: "roomId", 
            select: "name roomType capacity" 
          },
        ],
      })
      .lean();

    if (!order) {
      res.status(404).json({ 
        code: 404, 
        message: "Không tìm thấy đơn hàng" 
      });
      return;
    }

    res.status(200).json({
      code: 200,
      message: "Lấy chi tiết đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    console.error("Get order detail (admin) error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};