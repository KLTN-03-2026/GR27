import { Router, Request} from "express";
const router: Router = Router();

import * as authController from "../controllers/auth.controller";
import { validateForgotPassword, validateLogin, validateRegister, validateResetPassword } from "../validators/auth.validator";

// middlewares/otpLimiter.ts
import rateLimit from "express-rate-limit";
import { optionalAuthMiddleware } from "../../../middlewares/auth.middleware";

//set thời gian giãn cách gửi request
export const otpLimiterByEmail = rateLimit({
  windowMs: 60 * 1000, // 60 giây
  max: 1,              // Tối đa 1 request trong 60 giây
  keyGenerator: (req: Request): string => req.body.email, // Ưu tiên giới hạn theo email
  standardHeaders: true,
  message: {
    code: 429,
    message: "Bạn chỉ được yêu cầu OTP mỗi 60 giây.",
  },
  skipFailedRequests: true, // Không tính những request bị lỗi trước đó 
});

// Limiter cho việc nhập OTP (cho phép 5 lần thử trong 5 phút)
export const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 5,                  // Cho phép tối đa 5 lần thử
  keyGenerator: (req: Request): string => req.body.email,
  standardHeaders: true,
  message: {
    code: 429,
    message: "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 5 phút.",
  },
});




//---- CLIENT ----
//[POST] REGISTER: /api/v1/auth/register
router.post("/register", validateRegister, authController.register);
//[POST] CHECK EMAIL OTP: /api/v1/auth/register/check-email
router.post("/register/check-email", otpVerifyLimiter, authController.checkEmailOtp);
//[POST] CANCEL REGISTER: /api/v1/auth/register/cancel-register
router.post("/register/cancel-register", authController.cancelRegister);


//[POST] RESEND CHECK EMAIL OTP: /api/v1/auth/resendOtp
router.post("/resendOtp", otpLimiterByEmail, authController.resendOtp);


//[POST] LOGIN: /api/v1/auth/login
router.post("/login", validateLogin, authController.login);
//[POST] LOGOUT: /api/v1/auth/logout
router.post("/logout", authController.logout);

//[POST] FORGOT PASSWORD: /api/v1/auth/password/forgot
router.post("/password/forgot", validateForgotPassword, otpLimiterByEmail, authController.forgotPassword);
//[POST] CHECK OTP: /api/v1/auth/password/otp
router.post("/password/otp", otpVerifyLimiter, authController.otp);
//[POST] RESET PASSWORD: /api/v1/auth/password/reset
router.post("/password/reset", validateResetPassword, authController.resetPassword);

//--- CHECK LOGIN --
router.get("/me", optionalAuthMiddleware, authController.checkLogin);


export default router;