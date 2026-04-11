import { Request, Response, NextFunction } from "express";

// Kiểm tra ObjectId hợp lệ
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Validate tạo mới comment
export const validateCreateComment = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { filmId, rate, content } = req.body;

    // Validate filmId
    if (!filmId || !isValidObjectId(filmId)) {
      res.status(400).json({
        code: 400,
        message: "ID phim không hợp lệ",
      });
      return;
    }

    // Validate rate
    if (!rate || typeof rate !== "number") {
      res.status(400).json({
        code: 400,
        message: "Đánh giá không được để trống",
      });
      return;
    }

    if (rate < 1 || rate > 5) {
      res.status(400).json({
        code: 400,
        message: "Đánh giá phải từ 1 đến 5 sao",
      });
      return;
    }

    // Validate content
    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({
        code: 400,
        message: "Nội dung bình luận không được để trống",
      });
      return;
    }

    if (content.trim().length < 10) {
      res.status(400).json({
        code: 400,
        message: "Nội dung bình luận phải có ít nhất 10 ký tự",
      });
      return;
    }

    if (content.trim().length > 1000) {
      res.status(400).json({
        code: 400,
        message: "Nội dung bình luận không được vượt quá 1000 ký tự",
      });
      return;
    }

    // Làm sạch dữ liệu
    req.body.content = content.trim();

    next();
  } catch (error) {
    console.error("Comment validation error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Validate cập nhật comment
export const validateUpdateComment = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const body = { ...req.body };

    // Loại bỏ các trường không được phép sửa
    const forbiddenFields = [
      "userId",
      "filmId",
      "isReported",
      "createdAt",
      "updatedAt",
    ];

    forbiddenFields.forEach((field) => {
      if (body[field] !== undefined) {
        res.status(400).json({
          code: 400,
          message: `Không được phép sửa trường "${field}"`,
        });
        return;
      }
    });

    // Kiểm tra có ít nhất 1 trường được cập nhật
    if (body.rate === undefined && body.content === undefined) {
      res.status(400).json({
        code: 400,
        message: "Phải cung cấp ít nhất một trường để cập nhật (rate hoặc content)",
      });
      return;
    }

    // Validate rate nếu có
    if (body.rate !== undefined) {
      if (typeof body.rate !== "number") {
        res.status(400).json({
          code: 400,
          message: "Đánh giá phải là số",
        });
        return;
      }

      if (body.rate < 1 || body.rate > 5) {
        res.status(400).json({
          code: 400,
          message: "Đánh giá phải từ 1 đến 5 sao",
        });
        return;
      }
    }

    // Validate content nếu có
    if (body.content !== undefined) {
      if (typeof body.content !== "string" || !body.content.trim()) {
        res.status(400).json({
          code: 400,
          message: "Nội dung bình luận không được để trống",
        });
        return;
      }

      if (body.content.trim().length < 10) {
        res.status(400).json({
          code: 400,
          message: "Nội dung bình luận phải có ít nhất 10 ký tự",
        });
        return;
      }

      if (body.content.trim().length > 1000) {
        res.status(400).json({
          code: 400,
          message: "Nội dung bình luận không được vượt quá 1000 ký tự",
        });
        return;
      }

      body.content = body.content.trim();
    }

    // Gán lại body đã lọc vào req.body
    req.body = body;

    next();
  } catch (error) {
    console.error("Comment update validation error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};