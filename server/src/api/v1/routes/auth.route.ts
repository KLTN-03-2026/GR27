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
  skipFailedRequests: true, // Không tính những request bị lỗi trước đó (VD: nhập sai định dạng)
});




//---- CLIENT ----
//[POST] REGISTER: /api/v1/auth/register
router.post("/register", validateRegister, authController.register);
//[POST] CHECK EMAIL OTP: /api/v1/auth/register/check-email
router.post("/register/check-email", otpLimiterByEmail, authController.checkEmailOtp);
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
router.post("/password/otp", authController.otp);
//[POST] RESET PASSWORD: /api/v1/auth/password/reset
router.post("/password/reset", validateResetPassword, authController.resetPassword);

//--- CHECK LOGIN --
router.get("/me", optionalAuthMiddleware, authController.checkLogin);


export default router;