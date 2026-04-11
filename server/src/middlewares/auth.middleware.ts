import { Request, Response, NextFunction } from "express";
import User from "../api/v1/models/user.model";
import { UserStatus } from "../types/user.type";
import { verifyAccessToken, generateAccessToken, verifyRefreshToken, ITokenPayload } from "../helpers/jwt";

/**
 * ✅ JWT Authentication Middleware
 * Kiểm tra Access Token từ cookie, nếu hết hạn thì tự động refresh
 */
export const authMiddleware =
  (role: string) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accessToken = req.cookies.accessToken;
      const refreshToken = req.cookies.refreshToken;

      // Nếu không có cả 2 token thì yêu cầu đăng nhập
      if (!accessToken && !refreshToken) {
        res.status(401).json({ 
          code: 401, 
          message: "Vui lòng đăng nhập để tiếp tục" 
        });
        return;
      }

      let tokenPayload: ITokenPayload | null = null;

      // Thử verify access token trước
      if (accessToken) {
        try {
          tokenPayload = verifyAccessToken(accessToken);
        } catch (error: any) {
          console.log("Access token expired or invalid:", error.message);
          // Access token hết hạn/invalid, thử refresh
        }
      }

      // Nếu access token không hợp lệ, thử refresh token
      if (!tokenPayload && refreshToken) {
        try {
          const refreshPayload = verifyRefreshToken(refreshToken);
          
          // Kiểm tra refresh token có tồn tại trong DB không
          const user = await User.findOne({ 
            _id: refreshPayload.userId, 
            refreshToken: refreshToken,
            deleted: false 
          }).select("-password -createdAt -updatedAt -deletedAt");

          if (!user) {
            res.status(401).json({ 
              code: 401, 
              message: "Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại" 
            });
            return;
          }

          if (user.status === UserStatus.BLOCKED) {
            res.status(401).json({ 
              code: 401, 
              message: "Tài khoản đã bị khóa" 
            });
            return;
          }

          // Tạo access token mới
          const newTokenPayload: ITokenPayload = {
            userId: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role
          };
          
          const newAccessToken = generateAccessToken(newTokenPayload);

          // Set cookie access token mới
          res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 15 * 60 * 1000, // 15 phút
          });

          tokenPayload = newTokenPayload;
          req.user = user; // Gán user vào request
          
        } catch (error) {
          console.error("Refresh token invalid:", error);
          res.status(401).json({ 
            code: 401, 
            message: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại" 
          });
          return;
        }
      }

      // Nếu vẫn không có token hợp lệ
      if (!tokenPayload) {
        res.status(401).json({ 
          code: 401, 
          message: "Token không hợp lệ, vui lòng đăng nhập lại" 
        });
        return;
      }

      // Nếu chưa có user trong req (không phải từ refresh), lấy từ DB
      if (!req.user) {
        const user = await User.findById(tokenPayload.userId).select("-password -createdAt -updatedAt -deletedAt");
        
        if (!user || user.deleted) {
          res.status(401).json({ 
            code: 401, 
            message: "Tài khoản không tồn tại" 
          });
          return;
        }

        if (user.status === UserStatus.BLOCKED) {
          res.status(401).json({ 
            code: 401, 
            message: "Tài khoản đã bị khóa" 
          });
          return;
        }

        req.user = user;
      }

      // Kiểm tra role
      if (req.user.role !== role) {
        res.status(403).json({ 
          code: 403, 
          message: "Tài khoản không có quyền truy cập!" 
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  };

/**
 * ✅ Optional Auth Middleware - cho những route có thể guest hoặc đăng nhập
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken && !refreshToken) {
      req.user = null; // guest
      return next();
    }

    let tokenPayload: ITokenPayload | null = null;

    // Thử verify access token
    if (accessToken) {
      try {
        tokenPayload = verifyAccessToken(accessToken);
      } catch (error) {
        // Access token invalid, thử refresh
      }
    }

    // Thử refresh nếu access token không hợp lệ
    if (!tokenPayload && refreshToken) {
      try {
        const refreshPayload = verifyRefreshToken(refreshToken);
        
        const user = await User.findOne({ 
          _id: refreshPayload.userId, 
          refreshToken: refreshToken,
          deleted: false 
        }).select("-password -createdAt -updatedAt -deletedAt");

        if (user && user.status === UserStatus.ACTIVE) {
          const newTokenPayload: ITokenPayload = {
            userId: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role
          };
          
          const newAccessToken = generateAccessToken(newTokenPayload);

          res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 15 * 60 * 1000,
          });

          tokenPayload = newTokenPayload;
          req.user = user;
        }
      } catch (error) {
        console.log("Optional auth refresh failed:", error);
      }
    }

    // Nếu có token hợp lệ nhưng chưa có user, lấy từ DB
    if (tokenPayload && !req.user) {
      const user = await User.findById(tokenPayload.userId).select("-password");
      if (user && !user.deleted && user.status === UserStatus.ACTIVE) {
        req.user = user;
      } else {
        req.user = null;
      }
    }

    if (!req.user && !tokenPayload) {
      req.user = null; // guest
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    req.user = null; // fallback to guest
    next();
  }
};