import { Request, Response } from "express";
import * as authService from "../services/auth.service";

const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  const options = authService.getCookieOptions();
  res.cookie("accessToken", accessToken, {
    ...options,
    maxAge: authService.ACCESS_TOKEN_MAX_AGE,
  });
  res.cookie("refreshToken", refreshToken, {
    ...options,
    maxAge: authService.REFRESH_TOKEN_MAX_AGE,
  });
};

// [POST] /api/v1/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, username, password } = req.body;
  await authService.registerUser(email, username, password);
  res.json({ code: 200, message: "OTP đã được gửi qua email của bạn" });
};

// [POST] /api/v1/auth/register/check-email
export const checkEmailOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, otp } = req.body;
  const { accessToken, refreshToken } = await authService.verifyRegisterOtp(
    email,
    otp,
  );
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ code: 200, message: "Xác minh email và đăng nhập thành công" });
};

// [POST] /api/v1/auth/register/cancel-register
export const cancelRegister = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await authService.cancelUserRegistration(req.body.email);
  res.json({ code: 200, message: "Hủy đăng ký thành công" });
};

// [POST] /api/v1/auth/resendOtp
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, type } = req.body;
  await authService.resendUserOtp(email, type);
  res.json({ code: 200, message: "OTP đã được gửi qua email của bạn" });
};

// [POST] /api/v1/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { identifier, password } = req.body;
  const { accessToken, refreshToken, role } = await authService.loginUser(
    identifier,
    password,
  );
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ code: 200, message: "Đăng nhập thành công", role });
};

// [POST] /api/v1/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  await authService.logoutUser(req.cookies.refreshToken);
  const options = authService.getCookieOptions();
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
  res.json({ code: 200, message: "Đăng xuất thành công" });
};

// [POST] /api/v1/auth/password/forgot
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await authService.sendForgotPasswordOtp(req.body.email);
  res.json({ code: 200, message: "OTP đã được gửi qua email của bạn" });
};

// [POST] /api/v1/auth/password/otp
export const otp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;
  const resetToken = await authService.verifyForgotPasswordOtp(email, otp);
  res.json({
    code: 200,
    message: "Xác minh thành công, vui lòng đổi mật khẩu trong vòng 5 phút!",
    resetToken,
  });
};

// [POST] /api/v1/auth/password/reset
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, resetToken, newPassword } = req.body;
  const { accessToken, refreshToken } = await authService.resetUserPassword(
    email,
    resetToken,
    newPassword,
  );
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ code: 200, message: "Đổi mật khẩu thành công" });
};

// [GET] /api/v1/auth/check-login
export const checkLogin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(400).json({ code: 400, message: "Chưa đăng nhập" });
    return;
  }
  res.json({ code: 200, message: "Auth hợp lệ", user: req.user });
};
