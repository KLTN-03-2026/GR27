import { Request, Response, NextFunction } from "express";
import { PaymentMethod } from "../../../types/order.type";

// Kiểm tra ObjectId hợp lệ
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate create order
 */
export const validateCreateOrder = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { showtimeId, seats, comboFoods, paymentMethod } = req.body;

    // Validate showtimeId
    if (!showtimeId || !isValidObjectId(showtimeId)) {
      res.status(400).json({
        code: 400,
        message: "ID suất chiếu không hợp lệ",
      });
      return;
    }

    // Validate seats
    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      res.status(400).json({
        code: 400,
        message: "Phải chọn ít nhất một ghế",
      });
      return;
    }

    if (seats.length > 10) {
      res.status(400).json({
        code: 400,
        message: "Không được đặt quá 10 ghế trong một lần",
      });
      return;
    }

    const seenSeatKeys = new Set<string>();

    for (const seat of seats) {
      // Validate seatKey
      if (!seat.seatKey || typeof seat.seatKey !== "string" || !seat.seatKey.trim()) {
        res.status(400).json({
          code: 400,
          message: "Mã ghế không được để trống",
        });
        return;
      }

      // Kiểm tra trùng lặp seatKey
      if (seenSeatKeys.has(seat.seatKey)) {
        res.status(400).json({
          code: 400,
          message: `Ghế ${seat.seatKey} bị trùng lặp`,
        });
        return;
      }
      seenSeatKeys.add(seat.seatKey);

      // Validate type
      if (!seat.type || typeof seat.type !== "string") {
        res.status(400).json({
          code: 400,
          message: "Loại ghế không hợp lệ",
        });
        return;
      }

      // Validate unitPrice
      if (typeof seat.unitPrice !== "number" || seat.unitPrice <= 0) {
        res.status(400).json({
          code: 400,
          message: "Giá ghế không hợp lệ",
        });
        return;
      }
    }

    // Validate comboFoods (optional)
    if (comboFoods !== undefined) {
      if (!Array.isArray(comboFoods)) {
        res.status(400).json({
          code: 400,
          message: "Combo foods phải là mảng",
        });
        return;
      }

      if (comboFoods.length > 20) {
        res.status(400).json({
          code: 400,
          message: "Không được đặt quá 20 combo trong một lần",
        });
        return;
      }

      for (const combo of comboFoods) {
        // Validate comboFoodId
        if (!combo.comboFoodId || !isValidObjectId(combo.comboFoodId)) {
          res.status(400).json({
            code: 400,
            message: "ID combo không hợp lệ",
          });
          return;
        }

        // Validate name
        if (!combo.name || typeof combo.name !== "string") {
          res.status(400).json({
            code: 400,
            message: "Tên combo không hợp lệ",
          });
          return;
        }

        // Validate price
        if (typeof combo.price !== "number" || combo.price <= 0) {
          res.status(400).json({
            code: 400,
            message: "Giá combo không hợp lệ",
          });
          return;
        }

        // Validate quantity
        if (typeof combo.quantity !== "number" || combo.quantity <= 0) {
          res.status(400).json({
            code: 400,
            message: "Số lượng combo phải lớn hơn 0",
          });
          return;
        }

        if (combo.quantity > 10) {
          res.status(400).json({
            code: 400,
            message: "Số lượng mỗi combo không được vượt quá 10",
          });
          return;
        }
      }
    }

    // Validate paymentMethod (optional)
    if (paymentMethod !== undefined) {
      if (!Object.values(PaymentMethod).includes(paymentMethod)) {
        res.status(400).json({
          code: 400,
          message: `Phương thức thanh toán không hợp lệ. Chỉ chấp nhận: ${Object.values(PaymentMethod).join(", ")}`,
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error("Order validation error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};