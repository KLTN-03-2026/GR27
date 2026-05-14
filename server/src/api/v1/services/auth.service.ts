import User from "../models/user.model";
import Otp from "../models/otp.model";
import ResetToken from "../models/resetToken.model";
import { hashPassword, comparePassword } from "../../../helpers/password";
import {
  generateAccessToken,
  generateRefreshToken,
  ITokenPayload,
} from "../../../helpers/jwt";
import * as generateHelper from "../../../helpers/generate";
import * as sendMailHelper from "../../../helpers/sendMail";
import { IUser, UserRole, UserStatus } from "../../../types/user.type";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
};

export const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;        // 15 phút
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 ngày

export const getCookieOptions = () => COOKIE_OPTIONS;

// ── Helpers ────────────────────────────────────────────────────────────────

const buildTokenPayload = (user: any): ITokenPayload => ({
  userId: user._id.toString(),
  username: user.username,
  email: user.email,
  role: user.role,
});

const createAndSaveTokens = async (user: any) => {
  const accessToken = generateAccessToken(buildTokenPayload(user));
  const refreshToken = generateRefreshToken(user._id.toString());
  user.refreshToken = refreshToken;
  await user.save();
  return { accessToken, refreshToken };
};

const sendOtp = async (email: string, type: string) => {
  const otpRandom = generateHelper.generateRandomNumber();
  await Otp.findOneAndDelete({ email, type });
  await new Otp({ email, otp: otpRandom, type, expiresAt: Date.now() }).save();
  sendMailHelper.sendMail(email, "Movix - Mã OTP xác minh tài khoản", otpRandom);
};

// ── Service functions ───────────────────────────────────────────────────────

export const registerUser = async (email: string, username: string, password: string) => {
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    if (existing.email === email) throw { status: 400, message: "Email đã được sử dụng" };
    if (existing.username === username) throw { status: 400, message: "Tên đăng nhập đã được sử dụng" };
  }

  const hashedPassword = await hashPassword(password);
  const infoUser: Partial<IUser> = {
    email,
    username,
    password: hashedPassword,
    role: UserRole.USER,
    status: UserStatus.PENDING,
  };
  const user = new User(infoUser);
  await user.save();

  await sendOtp(email, "register");
};

export const verifyRegisterOtp = async (email: string, otp: string) => {
  if (!otp) throw { status: 400, message: "Vui lòng nhập otp" };

  const otpDoc = await Otp.findOne({ email, otp, type: "register" });
  if (!otpDoc) throw { status: 400, message: "Không tìm thấy otp" };

  const user = await User.findOne({ email, deleted: false });
  if (!user) throw { status: 400, message: "Tài khoản không tồn tại" };

  user.status = UserStatus.ACTIVE;
  const tokens = await createAndSaveTokens(user);
  await Otp.findOneAndDelete({ email, type: "register" });

  return tokens;
};

export const cancelUserRegistration = async (email: string) => {
  const user = await User.findOne({ email, status: UserStatus.PENDING, deleted: false });
  if (!user) throw { status: 400, message: "Tài khoản chưa được lưu trên hệ thống!" };

  await User.findOneAndDelete({ email });
  await Otp.findOneAndDelete({ email, type: "register" });
};

export const resendUserOtp = async (email: string, type: string) => {
  const user = await User.findOne({ email, deleted: false });
  if (!user) throw { status: 400, message: "Tài khoản không tồn tại!" };

  if (type === "register") {
    if (user.status === UserStatus.ACTIVE) throw { status: 400, message: "Tài khoản đã được xác minh!" };
    if (user.status === UserStatus.BLOCKED) throw { status: 400, message: "Tài khoản đã bị khóa" };
  }

  await sendOtp(email, type);
};

export const loginUser = async (identifier: string, password: string) => {
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
    deleted: false,
  });

  if (!user) throw { status: 400, message: "Tên đăng nhập hoặc email không đúng!" };

  if (user.status === UserStatus.PENDING) {
    throw {
      status: 403,
      code: "UNVERIFIED_ACCOUNT",
      message: "Tài khoản chưa được xác minh!",
      email: user.email,
    };
  }

  if (user.status === UserStatus.BLOCKED) throw { status: 400, message: "Tài khoản đã bị khóa!" };

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw { status: 400, message: "Mật khẩu không đúng!" };

  const tokens = await createAndSaveTokens(user);

  return { ...tokens, role: user.role };
};

export const logoutUser = async (refreshToken: string) => {
  if (refreshToken) {
    await User.findOneAndUpdate(
      { refreshToken },
      { $unset: { refreshToken: 1 } }
    );
  }
};

export const sendForgotPasswordOtp = async (email: string) => {
  if (!email) throw { status: 400, message: "Vui lòng nhập email" };

  const user = await User.findOne({ email, deleted: false });
  if (!user) throw { status: 400, message: "Tài khoản không tồn tại" };
  if (user.status === UserStatus.PENDING) throw { status: 400, message: "Tài khoản chưa được xác minh" };
  if (user.status === UserStatus.BLOCKED) throw { status: 400, message: "Tài khoản đã bị khóa" };

  await sendOtp(email, "forgot");
};

export const verifyForgotPasswordOtp = async (email: string, otp: string) => {
  const otpDoc = await Otp.findOne({ email, otp, type: "forgot" });
  if (!otpDoc) throw { status: 400, message: "Không tìm thấy otp" };

  const user = await User.findOne({ email, deleted: false });
  if (!user) throw { status: 400, message: "Tài khoản không tồn tại" };

  const tokenReset = generateHelper.generateToken();
  await new ResetToken({ email, expiresAt: Date.now(), resetToken: tokenReset }).save();
  await Otp.findOneAndDelete({ email });

  return tokenReset;
};

export const resetUserPassword = async (email: string, resetToken: string, newPassword: string) => {
  const resetTokenDoc = await ResetToken.findOne({ email, resetToken });
  if (!resetTokenDoc) throw { status: 400, message: "Dữ liệu check reset password lỗi, vui lòng làm lại từ đầu" };

  const user = await User.findOne({ email, deleted: false });
  if (!user) throw { status: 400, message: "Tài khoản không tồn tại" };
  if (user.status === UserStatus.BLOCKED) throw { status: 400, message: "Tài khoản đã bị khóa" };

  const isSamePassword = await comparePassword(newPassword, user.password);
  if (isSamePassword) throw { status: 400, message: "Mật khẩu mới không được giống mật khẩu cũ" };

  user.password = await hashPassword(newPassword);
  const tokens = await createAndSaveTokens(user);
  await ResetToken.findOneAndDelete({ email });

  return tokens;
};