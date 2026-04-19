import { Request, Response, NextFunction } from "express";
import User from "../api/v1/models/user.model";
import { UserStatus } from "../types/user.type";
import {
  verifyAccessToken,
  generateAccessToken,
  verifyRefreshToken,
  ITokenPayload,
} from "../helpers/jwt";

// ── Helper nội bộ ────────────────────────────────────────────────────────────

/**
 * Resolve user từ accessToken + refreshToken trong cookie.
 * - Thử verify accessToken trước.
 * - Nếu hết hạn/invalid thì thử refresh bằng refreshToken.
 * - Trả về { user, newAccessToken } nếu hợp lệ, null nếu không.
 */
const resolveUserFromTokens = async (
  req: Request,
  res: Response
): Promise<ITokenPayload | null> => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && !refreshToken) return null;

  // 1. Thử verify access token
  if (accessToken) {
    try {
      return verifyAccessToken(accessToken);
    } catch {
      // hết hạn hoặc invalid → thử refresh bên dưới
    }
  }

  // 2. Thử refresh token
  if (refreshToken) {
    try {
      const refreshPayload = verifyRefreshToken(refreshToken);

      const user = await User.findOne({
        _id: refreshPayload.userId,
        refreshToken,
        deleted: false,
      }).select("-password -createdAt -updatedAt -deletedAt");

      if (!user || user.status === UserStatus.BLOCKED) return null;

      const newTokenPayload: ITokenPayload = {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      };

      // Cấp lại access token mới vào cookie
      res.cookie("accessToken", generateAccessToken(newTokenPayload), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 15 * 60 * 1000,
      });

      req.user = user; // gán sẵn để không phải query lại
      return newTokenPayload;
    } catch {
      return null;
    }
  }

  return null;
};

// ── Middlewares ──────────────────────────────────────────────────────────────

/**
 * authMiddleware(role) — Yêu cầu đăng nhập VÀ đúng role.
 * authMiddleware([role1, role2]) — Yêu cầu đăng nhập VÀ có một trong các role.
 *
 * Ví dụ:
 *   authMiddleware(UserRole.ADMIN)
 *   authMiddleware([UserRole.ADMIN, UserRole.USER])
 */
export const authMiddleware =
  (roles: string | string[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tokenPayload = await resolveUserFromTokens(req, res);

      if (!tokenPayload) {
        const hasCookies = req.cookies.accessToken || req.cookies.refreshToken;
        res.status(401).json({
          code: 401,
          message: hasCookies
            ? "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại"
            : "Vui lòng đăng nhập để tiếp tục",
        });
        return;
      }

      // Lấy user từ DB nếu chưa có (trường hợp accessToken còn hạn)
      if (!req.user) {
        const user = await User.findById(tokenPayload.userId).select(
          "-password -createdAt -updatedAt -deletedAt"
        );

        if (!user || user.deleted) {
          res.status(401).json({ code: 401, message: "Tài khoản không tồn tại" });
          return;
        }

        if (user.status === UserStatus.BLOCKED) {
          res.status(401).json({ code: 401, message: "Tài khoản đã bị khóa" });
          return;
        }

        req.user = user;
      }

      // Kiểm tra role — hỗ trợ single role hoặc mảng role
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({ code: 403, message: "Tài khoản không có quyền truy cập!" });
        return;
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  };

/**
 * optionalAuthMiddleware — Không yêu cầu đăng nhập.
 * Nếu có token hợp lệ thì gán req.user, không thì req.user = null (guest).
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tokenPayload = await resolveUserFromTokens(req, res);

    if (!tokenPayload) {
      req.user = null;
      return next();
    }

    // Lấy user từ DB nếu chưa có
    if (!req.user) {
      const user = await User.findById(tokenPayload.userId).select("-password");
      req.user =
        user && !user.deleted && user.status === UserStatus.ACTIVE ? user : null;
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    req.user = null; // fallback to guest
    next();
  }
};