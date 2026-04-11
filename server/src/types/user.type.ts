export enum UserStatus {
  ACTIVE = "active",
  BLOCKED = "blocked",
  PENDING = "pending",
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export interface IUser {
  username: string;
  fullname?: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: UserRole;
  // ✅ THAY ĐỔI: Bỏ token, thêm refreshToken
  // token: string; // ❌ Xóa trường này
  refreshToken?: string; // ✅ Lưu refresh token trong DB để có thể revoke
  status: UserStatus;
  deleted?: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}