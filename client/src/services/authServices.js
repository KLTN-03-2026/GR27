import { API_ENDPOINTS } from "../constants";
import { get, post } from "../utils";

// -- Đăng nhập
export const login = (userData) => post(API_ENDPOINTS.AUTH.LOGIN, userData);

// -- Đăng ký
export const register = (userData) =>
  post(API_ENDPOINTS.AUTH.REGISTER, userData);


// -- Check Email OTP Đăng ký
export const checkEmailOtp = (data) =>
  post(API_ENDPOINTS.AUTH.REGISTER_CHECK_EMAIL, data);

// - Hủy đăng ký
export const cancelRegister = (email) =>
  post(API_ENDPOINTS.AUTH.REGISTER_CANCEL, { email });

// -- Resend OTP
export const resendOtp = (data) =>
  post(API_ENDPOINTS.AUTH.RESEND_OTP, data);

// -- Forgot Password
export const forgotPassword = (data) =>
  post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);

// -- Check OTP
export const checkOtp = (data) =>
  post(API_ENDPOINTS.AUTH.CHECK_OTP, data);

// -- Reset Password
export const resetPassword = (data) =>
  post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);


// -- Đăng Xuất
export const logout = () => post(API_ENDPOINTS.AUTH.LOGOUT);

// -- Kiểm tra Login
export const checkLogin = () => get(API_ENDPOINTS.AUTH.ME);
