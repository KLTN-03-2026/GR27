import jwt, { JwtPayload } from "jsonwebtoken";

export interface ITokenPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

/**
 * Tạo Access Token - thời hạn 15 phút
 * Chứa thông tin cần thiết cho authentication
 */
export const generateAccessToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "15m", // 15 phút - ngắn để bảo mật cao
  });
};

/**
 * Tạo Refresh Token - thời hạn 7 ngày  
 * Chỉ chứa userId để tối thiểu hóa thông tin
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d", // 7 ngày như yêu cầu
  });
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token: string): ITokenPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as ITokenPayload;
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
};

/**
 * Decode token không verify (dùng khi cần lấy thông tin từ expired token)
 */
export const decodeToken = (token: string): ITokenPayload | null => {
  try {
    return jwt.decode(token) as ITokenPayload;
  } catch (error) {
    return null;
  }
};