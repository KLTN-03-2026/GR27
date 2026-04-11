import { Request, Response, NextFunction } from "express";
import { validatePassword, validatePhone } from "./common.validator";
import { UserRole, UserStatus } from "../../../types/user.type";

export const validateChangePassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body as {
      oldPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    // Kiểm tra mật khẩu cũ
    if (!oldPassword) {
      return res.status(400).json({
        code: 400,
        message: "Mật khẩu cũ không được để trống",
      });
    }

    // Kiểm tra mật khẩu mới
    if (!newPassword) {
      return res.status(400).json({
        code: 400,
        message: "Mật khẩu mới không được để trống",
      });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({
        code: 400,
        message: passwordError,
      });
    }

    // Kiểm tra xác nhận mật khẩu
    if (!confirmPassword) {
      return res.status(400).json({
        code: 400,
        message: "Xác nhận mật khẩu không được để trống",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        code: 400,
        message: "Mật khẩu xác nhận không khớp",
      });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const validateUpdateProfile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = { ...req.body }; // copy để thao tác

    // Loại bỏ các trường không được phép sửa
    const forbiddenFields = [
      "username",
      "email",
      "password",
      "role",
      "status",
      "token",
    ];
    forbiddenFields.forEach((field) => delete body[field]);

    // Validate fullname
    if (body.fullname && body.fullname.length > 100) {
      return res.status(400).json({
        code: 400,
        message: "Họ và tên không được vượt quá 100 ký tự",
      });
    }

    // Validate phone
    if (body.phone) {
      const phoneError = validatePhone(body.phone);
      if (phoneError) {
        return res.status(400).json({
          code: 400,
          message: phoneError,
        });
      }
    }

    // Validate address
    if (body.address && body.address.length > 200) {
      return res.status(400).json({
        code: 400,
        message: "Địa chỉ không được vượt quá 200 ký tự",
      });
    }

    // Gán lại body đã lọc vào req.body
    req.body = body;

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const validateUpdateRole = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        code: 400,
        message: "Role không được để trống",
      });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        code: 400,
        message: "Role không hợp lệ. Chỉ chấp nhận 'user' hoặc 'admin'",
      });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const validateUpdateStatus = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        code: 400,
        message: "Status không được để trống",
      });
    }

    if (!Object.values(UserStatus).includes(status)) {
      return res.status(400).json({
        code: 400,
        message: "Status không hợp lệ. Chỉ chấp nhận 'active', 'blocked', hoặc 'pending'",
      });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};