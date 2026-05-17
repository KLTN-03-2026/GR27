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
  refreshToken?: string; 
  status: UserStatus;
  deleted?: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}