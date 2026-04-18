import { Request, Response, NextFunction } from "express";

export interface AppError {
  status: number;
  message: string;
  [key: string]: any; // cho phép spread thêm field như email, code đặc biệt...
}

// Middleware này đặt CUỐI CÙNG trong index.ts, sau tất cả các routes
// Express nhận diện error middleware khi có đủ 4 tham số: (err, req, res, next)
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Lỗi từ service throw { status, message, ...rest }
  if (err?.status && typeof err.status === "number") {
    const { status, message, ...rest } = err;
    res.status(status).json({ code: status, message, ...rest });
    return;
  }

  // Lỗi không mong muốn (bug, DB lỗi, v.v.)
  console.error("[Unhandled Error]", err);
  res.status(500).json({ code: 500, message: "Lỗi server" });
};