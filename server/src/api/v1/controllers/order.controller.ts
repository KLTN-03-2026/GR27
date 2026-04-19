import { Request, Response } from "express";
import * as orderService from "../services/order.service";
import { ICreateOrderPayload } from "../../../types/order.type";

// [POST] /api/v1/orders
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const result = await orderService.createOrder(
    req.user!._id.toString(),
    req.body as ICreateOrderPayload
  );
  res.status(201).json({ code: 201, message: "Tạo đơn hàng thành công", data: result });
};

// [POST] /api/v1/orders/webhook
export const paymentWebhook = async (req: Request, res: Response): Promise<void> => {
  const result = await orderService.handlePaymentWebhook(req.body);

  if (result.alreadyProcessed) {
    res.status(200).json({ code: 200, message: "Webhook already processed" });
    return;
  }

  res.status(200).json({ code: 200, message: "Webhook processed" });
};

// [GET] /api/v1/orders/me
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const { orderStatus, filmId } = req.query as Record<string, string>;

  const result = await orderService.getMyOrders(req.user!._id.toString(), page, orderStatus, filmId);

  res.status(200).json({
    code: 200,
    message: "Thành công",
    data: result.orders,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
};

// [GET] /api/v1/orders/:id
export const getOrderDetail = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.getOrderDetail(req.params.id, req.user!._id.toString());
  res.status(200).json({ code: 200, message: "Thành công", data: order });
};

/**
 * [GET] CHECK PAYMENT STATUS: /api/v1/orders/:id/check-payment
 *  API này dùng để check trạng thái thanh toán từ PayOS
 * Dùng khi test local không có webhook
 */
export const checkPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  const result = await orderService.checkPaymentStatus(req.params.id, req.user!._id.toString());

  const messageMap: Record<string, string> = {
    PAID: "Thanh toán thành công",
    CANCELLED: "Thanh toán thất bại hoặc đã hủy",
    PENDING: "Đơn hàng đang chờ thanh toán",
  };

  res.status(200).json({
    code: 200,
    message: messageMap[result.status] || "Thành công",
    data: result,
  });
};

// [PATCH] /api/v1/orders/:id/cancel
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  await orderService.cancelOrder(req.params.id, req.user!._id.toString());
  res.status(200).json({ code: 200, message: "Hủy đơn hàng thành công" });
};

// [GET] /api/v1/orders/admin  (admin)
export const index = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const { search, orderStatus, paymentStatus, filmId, cinemaId, startDate, endDate } =
    req.query as Record<string, string>;

  const result = await orderService.getOrdersAdmin({
    page, limit, search, orderStatus, paymentStatus, filmId, cinemaId, startDate, endDate,
  });

  res.status(200).json({
    code: 200,
    message: "Lấy danh sách đơn hàng thành công",
    data: result.orders,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
};

// [GET] /api/v1/orders/admin/:id  (admin)
export const getOrderDetailAdmin = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.getOrderDetailAdmin(req.params.id);
  res.status(200).json({ code: 200, message: "Lấy chi tiết đơn hàng thành công", data: order });
};