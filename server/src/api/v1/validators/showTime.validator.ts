import { Request, Response, NextFunction } from "express";
import { CommonStatus } from "../../../types/common.type";
import { SeatType } from "../../../types/room.type";

// Kiểm tra ObjectId hợp lệ
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Validate tạo mới showtime
export const validateCreateShowTime = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const {
      filmId,
      cinemaId,
      roomId,
      startTime,
      endTime,
      format,
      basePrice,
      seatTypes,
      status,
    } = req.body;

    // Validate filmId
    if (!filmId || !isValidObjectId(filmId)) {
      res.status(400).json({
        code: 400,
        message: "ID phim không hợp lệ",
      });
      return;
    }

    // Validate cinemaId
    if (!cinemaId || !isValidObjectId(cinemaId)) {
      res.status(400).json({
        code: 400,
        message: "ID rạp chiếu không hợp lệ",
      });
      return;
    }

    // Validate roomId
    if (!roomId || !isValidObjectId(roomId)) {
      res.status(400).json({
        code: 400,
        message: "ID phòng chiếu không hợp lệ",
      });
      return;
    }

    // Validate startTime
    if (!startTime) {
      res.status(400).json({
        code: 400,
        message: "Thời gian bắt đầu không được để trống",
      });
      return;
    }

    const startTimeObj = new Date(startTime);
    if (isNaN(startTimeObj.getTime())) {
      res.status(400).json({
        code: 400,
        message: "Thời gian bắt đầu không hợp lệ",
      });
      return;
    }

    // Kiểm tra startTime phải sau thời điểm hiện tại
    if (startTimeObj < new Date()) {
      res.status(400).json({
        code: 400,
        message: "Thời gian bắt đầu phải sau thời điểm hiện tại",
      });
      return;
    }

    // Validate endTime
    if (!endTime) {
      res.status(400).json({
        code: 400,
        message: "Thời gian kết thúc không được để trống",
      });
      return;
    }

    const endTimeObj = new Date(endTime);
    if (isNaN(endTimeObj.getTime())) {
      res.status(400).json({
        code: 400,
        message: "Thời gian kết thúc không hợp lệ",
      });
      return;
    }

    // Kiểm tra endTime phải sau startTime
    if (endTimeObj <= startTimeObj) {
      res.status(400).json({
        code: 400,
        message: "Thời gian kết thúc phải sau thời gian bắt đầu",
      });
      return;
    }

    // Kiểm tra khoảng thời gian hợp lý (ít nhất 30 phút, tối đa 5 giờ)
    const duration = (endTimeObj.getTime() - startTimeObj.getTime()) / (1000 * 60);
    if (duration < 30) {
      res.status(400).json({
        code: 400,
        message: "Thời lượng suất chiếu phải ít nhất 30 phút",
      });
      return;
    }

    if (duration > 300) {
      res.status(400).json({
        code: 400,
        message: "Thời lượng suất chiếu không được vượt quá 5 giờ",
      });
      return;
    }

    // Validate format
    if (!format || typeof format !== "string" || !format.trim()) {
      res.status(400).json({
        code: 400,
        message: "Định dạng chiếu không được để trống",
      });
      return;
    }

    const validFormats = ["2D", "3D", "IMAX", "4DX"];
    if (!validFormats.includes(format)) {
      res.status(400).json({
        code: 400,
        message: `Định dạng chiếu không hợp lệ. Chỉ chấp nhận: ${validFormats.join(", ")}`,
      });
      return;
    }

    // Validate basePrice
    if (!basePrice || typeof basePrice !== "number" || basePrice <= 0) {
      res.status(400).json({
        code: 400,
        message: "Giá cơ bản phải là số dương",
      });
      return;
    }

    if (basePrice < 10000) {
      res.status(400).json({
        code: 400,
        message: "Giá cơ bản phải ít nhất 10,000 VNĐ",
      });
      return;
    }

    if (basePrice > 1000000) {
      res.status(400).json({
        code: 400,
        message: "Giá cơ bản không được vượt quá 1,000,000 VNĐ",
      });
      return;
    }

    // Validate seatTypes
    if (!seatTypes || !Array.isArray(seatTypes) || seatTypes.length === 0) {
      res.status(400).json({
        code: 400,
        message: "Phải có ít nhất một loại phụ phí ghế",
      });
      return;
    }

    const seenTypes = new Set<string>();
    for (const seatType of seatTypes) {
      // Validate type
      if (!seatType.type || !Object.values(SeatType).includes(seatType.type)) {
        res.status(400).json({
          code: 400,
          message: `Loại ghế không hợp lệ. Chỉ chấp nhận: ${Object.values(SeatType).join(", ")}`,
        });
        return;
      }

      // Kiểm tra trùng lặp type
      if (seenTypes.has(seatType.type)) {
        res.status(400).json({
          code: 400,
          message: `Loại ghế ${seatType.type} bị trùng lặp`,
        });
        return;
      }
      seenTypes.add(seatType.type);

      // Validate extraFee
      if (typeof seatType.extraFee !== "number" || seatType.extraFee < 0) {
        res.status(400).json({
          code: 400,
          message: `Phụ phí cho ghế ${seatType.type} phải là số không âm`,
        });
        return;
      }

      if (seatType.extraFee > 500000) {
        res.status(400).json({
          code: 400,
          message: `Phụ phí cho ghế ${seatType.type} không được vượt quá 500,000 VNĐ`,
        });
        return;
      }
    }

    // Validate status (optional)
    if (status && !Object.values(CommonStatus).includes(status)) {
      res.status(400).json({
        code: 400,
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${Object.values(CommonStatus).join(", ")}`,
      });
      return;
    }

    next();
  } catch (error) {
    console.error("ShowTime validation error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// ✅ Validate cập nhật showtime
export const validateUpdateShowTime = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const body = { ...req.body };

    // ✅ Loại bỏ các trường hệ thống
    const systemFields = ["seats", "createdAt", "updatedAt", "deleted"];
    systemFields.forEach((field) => delete body[field]);

    // ✅ LOGIC MỚI: Kiểm tra có ghế BOOKED sẽ được xử lý trong controller
    // Validator CHỈ kiểm tra format dữ liệu hợp lệ

    // Validate filmId nếu có
    if (body.filmId !== undefined && !isValidObjectId(body.filmId)) {
      res.status(400).json({
        code: 400,
        message: "ID phim không hợp lệ",
      });
      return;
    }

    // Validate cinemaId nếu có
    if (body.cinemaId !== undefined && !isValidObjectId(body.cinemaId)) {
      res.status(400).json({
        code: 400,
        message: "ID rạp chiếu không hợp lệ",
      });
      return;
    }

    // Validate roomId nếu có
    if (body.roomId !== undefined && !isValidObjectId(body.roomId)) {
      res.status(400).json({
        code: 400,
        message: "ID phòng chiếu không hợp lệ",
      });
      return;
    }

    // Validate startTime nếu có
    if (body.startTime !== undefined) {
      const startTimeObj = new Date(body.startTime);
      if (isNaN(startTimeObj.getTime())) {
        res.status(400).json({
          code: 400,
          message: "Thời gian bắt đầu không hợp lệ",
        });
        return;
      }
    }

    // Validate endTime nếu có
    if (body.endTime !== undefined) {
      const endTimeObj = new Date(body.endTime);
      if (isNaN(endTimeObj.getTime())) {
        res.status(400).json({
          code: 400,
          message: "Thời gian kết thúc không hợp lệ",
        });
        return;
      }
    }

    // Nếu cập nhật cả startTime và endTime, kiểm tra logic
    if (body.startTime !== undefined && body.endTime !== undefined) {
      const startTimeObj = new Date(body.startTime);
      const endTimeObj = new Date(body.endTime);

      if (endTimeObj <= startTimeObj) {
        res.status(400).json({
          code: 400,
          message: "Thời gian kết thúc phải sau thời gian bắt đầu",
        });
        return;
      }

      const duration = (endTimeObj.getTime() - startTimeObj.getTime()) / (1000 * 60);
      if (duration < 30 || duration > 300) {
        res.status(400).json({
          code: 400,
          message: "Thời lượng suất chiếu phải từ 30 phút đến 5 giờ",
        });
        return;
      }
    }

    // Validate format nếu có
    if (body.format !== undefined) {
      const validFormats = ["2D", "3D", "IMAX", "4DX"];
      if (!validFormats.includes(body.format)) {
        res.status(400).json({
          code: 400,
          message: `Định dạng chiếu không hợp lệ. Chỉ chấp nhận: ${validFormats.join(", ")}`,
        });
        return;
      }
    }

    // Validate basePrice nếu có
    if (body.basePrice !== undefined) {
      if (typeof body.basePrice !== "number" || body.basePrice <= 0) {
        res.status(400).json({
          code: 400,
          message: "Giá cơ bản phải là số dương",
        });
        return;
      }

      if (body.basePrice < 10000 || body.basePrice > 1000000) {
        res.status(400).json({
          code: 400,
          message: "Giá cơ bản phải từ 10,000 đến 1,000,000 VNĐ",
        });
        return;
      }
    }

    // Validate seatTypes nếu có
    if (body.seatTypes !== undefined) {
      if (!Array.isArray(body.seatTypes) || body.seatTypes.length === 0) {
        res.status(400).json({
          code: 400,
          message: "Phải có ít nhất một loại phụ phí ghế",
        });
        return;
      }

      const seenTypes = new Set<string>();
      for (const seatType of body.seatTypes) {
        if (!seatType.type || !Object.values(SeatType).includes(seatType.type)) {
          res.status(400).json({
            code: 400,
            message: `Loại ghế không hợp lệ. Chỉ chấp nhận: ${Object.values(SeatType).join(", ")}`,
          });
          return;
        }

        if (seenTypes.has(seatType.type)) {
          res.status(400).json({
            code: 400,
            message: `Loại ghế ${seatType.type} bị trùng lặp`,
          });
          return;
        }
        seenTypes.add(seatType.type);

        if (typeof seatType.extraFee !== "number" || seatType.extraFee < 0) {
          res.status(400).json({
            code: 400,
            message: `Phụ phí cho ghế ${seatType.type} phải là số không âm`,
          });
          return;
        }

        if (seatType.extraFee > 500000) {
          res.status(400).json({
            code: 400,
            message: `Phụ phí cho ghế ${seatType.type} không được vượt quá 500,000 VNĐ`,
          });
          return;
        }
      }
    }

    // Validate status nếu có
    if (body.status !== undefined && !Object.values(CommonStatus).includes(body.status)) {
      res.status(400).json({
        code: 400,
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${Object.values(CommonStatus).join(", ")}`,
      });
      return;
    }

    // Gán lại body đã lọc vào req.body
    req.body = body;

    next();
  } catch (error) {
    console.error("ShowTime update validation error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};