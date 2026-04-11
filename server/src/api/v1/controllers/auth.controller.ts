import { Request, Response } from "express";
import User from "../models/user.model";
import { hashPassword, comparePassword } from "../../../helpers/password";
import {
  generateAccessToken,
  generateRefreshToken,
  ITokenPayload,
} from "../../../helpers/jwt";
import * as generateHelper from "../../../helpers/generate";
import * as sendMailHelper from "../../../helpers/sendMail";
import Otp from "../models/otp.model";
import { IUser, UserRole, UserStatus } from "../../../types/user.type";
import ResetToken from "../models/resetToken.model";


//[POST] /api/v1/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    //1. Lấy thông tin người dùng nhập vào
    const email: string = req.body.email;
    const username: string = req.body.username;
    const password: string = req.body.password;

    //2. Kiểm tra tồn tại
    const checkUser = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (checkUser) {
      if (checkUser.email === email) {
        res.status(400).json({ message: "Email đã được sử dụng" });
        return;
      }
      if (checkUser.username === username) {
        res.status(400).json({ message: "Tên đăng nhập đã được sử dụng" });
        return;
      }
    }

    //3. ✅ THAY ĐỔI: Hash password bằng bcrypt và không lưu token nữa
    const hashedPassword = await hashPassword(password);

    const infoUser: Partial<IUser> = {
      email,
      username,
      password: hashedPassword, // ✅ Lưu password đã hash
      // token, // ❌ Không cần token nữa
      role: UserRole.USER,
      status: UserStatus.PENDING,
    };
    const user = new User(infoUser);
    await user.save();

    //4. Tạo otp và gửi mail;
    const otpRandom = generateHelper.generateRandomNumber();
    const otbObject = {
      email: email,
      otp: otpRandom,
      type: "register",
      expiresAt: Date.now(),
    };
    const otp = new Otp(otbObject);
    await otp.save();
    const subject = "Movix - Mã OTP xác minh tài khoản";
    sendMailHelper.sendMail(email, subject, otpRandom);
    res.json({ code: 200, message: "OTP đã được gửi qua email của bạn" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};


//[POST] /api/v1/auth/register/check-email
export const checkEmailOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    //1. Nhận thông tin từ client
    const { email, otp } = req.body;
    //2. Kiem tra otp có nhập hay không
    if (!otp) {
      res.status(400).json({ message: "Vui lòng nhập otp" });
      return;
    }
    //3. Kiem tra otp có tồn tại hay không
    const otpCheck = await Otp.findOne({
      email: email,
      otp: otp,
      type: "register",
    });
    //4. Nếu không tồn tại thông báo lỗi
    if (!otpCheck) {
      res.status(400).json({ message: "Không tìm thấy otp" });
      return;
    }
    //5. Kiem tra email cua nguoi dung co ton tai hay khong
    const user = await User.findOne({ email: email, deleted: false });
    if (!user) {
      res.status(400).json({ message: "Tài khoản không tồn tại" });
      return;
    }

    //6. ✅ THAY ĐỔI: Cập nhật status và tạo JWT tokens
    user.status = UserStatus.ACTIVE;

    // Tạo JWT tokens
    const tokenPayload: ITokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Lưu refresh token vào database
    user.refreshToken = refreshToken;
    await user.save();

    // Xóa otp đi
    await Otp.findOneAndDelete({ email: email, type: "register" });

    // ✅ Set cookies với JWT tokens
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 phút
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    res.json({ code: 200, message: "Xác minh email và đăng nhập thành công" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//[POST] /api/v1/auth/register/cancel-register
export const cancelRegister = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({
      email: email,
      status: UserStatus.PENDING,
      deleted: false,
    });
    if (!user) {
      res
        .status(400)
        .json({ message: "Tài khoản chưa được lưu trên hệ thống!" });
      return;
    }
    await User.findOneAndDelete({ email: email });
    await Otp.findOneAndDelete({ email: email, type: "register" });
    res.json({ code: 200, message: "Hủy đăng ký thành công" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//[POST] /api/v1/auth/resendOtp
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    //1. Nhận email và type otp
    const { email, type } = req.body;
    //2. Tìm xem user có tồn tại hay không
    const user = await User.findOne({ email: email, deleted: false });
    //3. Nếu không tìm thấy user thì báo lỗi
    if (!user) {
      res.status(400).json({ message: "Tài khoản không tồn tại!" });
      return;
    }
    //4. Nếu type là register mà tài khoản đã được xác minh thì báo lỗi
    if (type === "register") {
      if (user.status === UserStatus.ACTIVE) {
        res.status(400).json({ message: "Tài khoản đã được xác minh!" });
        return;
      }
      if (user.status === UserStatus.BLOCKED) {
        res.status(400).json({ message: "Tài khoản đã bị khóa" });
        return;
      }
    }
    //5. Tạo otp và gửi mail (2 trường hợp check email là register và forgot password)
    const otpRandom = generateHelper.generateRandomNumber();
    await Otp.findOneAndDelete({ email: email, type: type });
    const otbObject = {
      email: email,
      otp: otpRandom,
      type: type,
      expiresAt: Date.now(),
    };
    const otp = new Otp(otbObject);
    await otp.save();
    const subject = "Movix - Mã OTP xác minh tài khoản";
    sendMailHelper.sendMail(email, subject, otpRandom);
    res.json({ code: 200, message: "OTP đã được gửi qua email của bạn" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Loi server" });
  }
};

// [POST] /api/v1/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body; // dùng identifier thay vì email
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
      deleted: false,
    });

    if (!user) {
      res.status(400).json({ message: "Tên đăng nhập hoặc email không đúng!" });
      return;
    }

    if (user.status === UserStatus.PENDING) {
      res.status(400).json({ message: "Tài khoản chưa được xác minh!" });
      return;
    }

    if (user.status === UserStatus.BLOCKED) {
      res.status(400).json({ message: "Tài khoản đã bị khóa!" });
      return;
    }

    // Dùng bcrypt để so sánh password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Mật khẩu không đúng!" });
      return;
    }

    // ✅ Tạo JWT tokens
    const tokenPayload: ITokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Lưu refresh token mới vào database (revoke token cũ nếu có)
    user.refreshToken = refreshToken;
    await user.save();

    // ✅ Set cookies với JWT tokens
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 phút
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    res.json({ code: 200, message: "Đăng nhập thành công" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//[POST] /api/v1/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ THAY ĐỔI: Xóa refresh token khỏi database để revoke session
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken: refreshToken },
        { $unset: { refreshToken: 1 } } // Xóa trường refreshToken
      );
    }

    // Xóa cả 2 cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ code: 200, message: "Đăng xuất thành công" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Loi server" });
  }
};

//[POST] /api/v1/auth/password/forgot
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    //1. Kiểm tra email
    const email: string = req.body.email;
    if (!email) {
      res.status(400).json({ message: "Vui lý nhập email" });
      return;
    }
    const user = await User.findOne({ email: email, deleted: false });
    // 2. Kiểm tra user
    if (!user) {
      res.status(400).json({ message: "Tài khoản không tồn tại" });
      return;
    }
    if (user.status === UserStatus.PENDING) {
      res.status(400).json({ message: "Tài khoản chưa được xác minh" });
      return;
    }
    if (user.status === UserStatus.BLOCKED) {
      res.status(400).json({ message: "Tài khoản được bị khóa" });
      return;
    }
    //3. Tạo otp và gửi otp với type = forgot về mail
    const otpRandom = generateHelper.generateRandomNumber();
    const otbObject = {
      email: email,
      otp: otpRandom,
      type: "forgot",
      expiresAt: Date.now(),
    };
    const otp = new Otp(otbObject);
    await otp.save();
    const subject = "Movix - Mã OTP xác minh tài khoản";
    sendMailHelper.sendMail(email, subject, otpRandom);
    res.json({ code: 200, message: "OTP đã được gửi qua email của bạn" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//[POST] /api/v1/auth/password/otp
export const otp = async (req: Request, res: Response): Promise<void> => {
  try {
    //1. Kiem tra otp, và tài khoản
    const { email, otp } = req.body;
    const otpCheck = await Otp.findOne({
      email: email,
      otp: otp,
      type: "forgot",
    });
    if (!otpCheck) {
      res.status(400).json({ message: "Không tìm thấy otp" });
      return;
    }
    const user = await User.findOne({ email: email, deleted: false });
    if (!user) {
      res.status(400).json({ message: "Tài khoản không tồn tại" });
      return;
    }
    //2. Tạo reset token chuẩn bị cho check reset password
    const tokenReset = generateHelper.generateToken();
    const objectResetToken = {
      email: email,
      expiresAt: Date.now(),
      resetToken: tokenReset,
    };
    const resetToken = new ResetToken(objectResetToken);
    await resetToken.save();
    await Otp.findOneAndDelete({ email: email });
    res.json({
      code: 200,
      message: "Xác minh thành công, vui lòng đổi mật khẩu trong vòng 5 phút!",
      resetToken: resetToken.resetToken,
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//[POST] api/v1/auth/password/reset
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, resetToken, newPassword } = req.body as {
      email: string;
      resetToken: string;
      newPassword: string;
    };
    const resetTokenCheck = await ResetToken.findOne({
      email: email,
      resetToken: resetToken,
    });
    if (!resetTokenCheck) {
      res.status(400).json({
        message: "Dữ liệu check reset password lỗi, vui lòng làm lại từ đầu",
      });
      return;
    }
    const user = await User.findOne({ email: email, deleted: false });
    if (!user) {
      res.status(400).json({ message: "Tài khoản không tồn tại" });
      return;
    }
    if (user.status === UserStatus.BLOCKED) {
      res.status(400).json({ message: "Tài khoản đã bị khóa" });
      return;
    }
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      res
        .status(400)
        .json({ message: "Mật khẩu mới không được giống mật khẩu cũ" });
      return;
    }
    // Cập nhập Password mới
    user.password = await hashPassword(newPassword);

    // ✅ Tạo JWT tokens
    const tokenPayload: ITokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Lưu refresh token mới vào database (revoke token cũ nếu có)
    user.refreshToken = refreshToken;
    await user.save();
    await ResetToken.findOneAndDelete({ email: email });
    // ✅ Set cookies với JWT tokens
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 phút
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
    res.json({ code: 200, message: "Đổi mật khẩu thành công" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const checkLogin = async (req: Request, res: Response) : Promise<void> => {
  try {
    if(!req.user){
      res.status(400).json({
        code: 400,
        message: "Chưa đăng nhập",
      });
      return;
    }
    res.json({
      code: 200,
      message: "Auth hợp lệ",
      user: req.user,
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
