import { Request, Response, NextFunction } from "express";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "./common.validator";


//validate login
export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { identifier, password } = req.body as {
      identifier: string;
      password: string;
    };

    if (!identifier) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email hoặc tên người dùng" });
    }

    // Kiểm tra nếu là email
    if (identifier.includes("@")) {
      const emailError = validateEmail(identifier);
      if (emailError) {
        return res.status(400).json({ message: emailError });
      }
    } else {
      // Nếu không có @ => coi là username
      const usernameError = validateUsername(identifier);
      if (usernameError) {
        return res.status(400).json({ message: usernameError });
      }
    }

    // Validate mật khẩu
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    next(); // ✅ hợp lệ thì cho chạy tiếp
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Validate register
export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ message: emailError });

    const usernameError = validateUsername(username);
    if (usernameError) return res.status(400).json({ message: usernameError });

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu nhập lại không khớp" });
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Validate forgot password
export const validateForgotPassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      res.status(400).json({ code: 400, message: "Email là bắt buộc!!!" });
      return;
    }
    const emailError = validateEmail(email);
    if (emailError) {
      res.status(400).json({ code: 400, message: emailError });
      return;
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Validate reset password
export const validateResetPassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { newPassword, confirmPassword } = req.body as {
      newPassword?: string;
      confirmPassword?: string;
    };

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
