import User from "../models/user.model";
import { hashPassword, comparePassword } from "../../../helpers/password";
import { UserStatus, UserRole } from "../../../types/user.type";

// ── Admin ───────────────────────────────────────────────────────────────────

export interface IGetUsersQuery {
  page?: number;
  limit?: number;
  keyword?: string;
  role?: string;
  status?: string;
}

export const getUsers = async ({ page = 1, limit = 10, keyword, role, status }: IGetUsersQuery) => {
  const skip = (page - 1) * limit;
  const query: any = { deleted: false };

  if (keyword) {
    const regex = { $regex: keyword, $options: "i" };
    query.$or = [{ username: regex }, { email: regex }, { fullname: regex }];
  }

  if (role && Object.values(UserRole).includes(role as UserRole)) {
    query.role = role;
  }

  if (status && Object.values(UserStatus).includes(status as UserStatus)) {
    query.status = status;
  }

  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return { users, total, page, limit };
};

export const getUserById = async (id: string) => {
  const user = await User.findById(id).select("-password -refreshToken");
  if (!user) throw { status: 404, message: "Không tìm thấy user" };
  return user;
};

export const updateUserRole = async (id: string, role: string, requesterId: string) => {
  if (!role || !Object.values(UserRole).includes(role as UserRole)) {
    throw { status: 400, message: "Role không hợp lệ. Chỉ chấp nhận 'user' hoặc 'admin'" };
  }

  if (id === requesterId) {
    throw { status: 403, message: "Bạn không thể thay đổi role của chính mình" };
  }

  const user = await User.findOne({ _id: id, deleted: false });
  if (!user) throw { status: 404, message: "Không tìm thấy người dùng" };

  user.role = role as UserRole;
  await user.save();
  return { _id: user._id, username: user.username, email: user.email, role: user.role };
};

export const updateUserStatus = async (id: string, status: string, requesterId: string) => {
  if (!status || !Object.values(UserStatus).includes(status as UserStatus)) {
    throw { status: 400, message: "Status không hợp lệ. Chỉ chấp nhận 'active', 'blocked', hoặc 'pending'" };
  }

  if (id === requesterId) {
    throw { status: 403, message: "Bạn không thể thay đổi trạng thái của chính mình" };
  }

  const user = await User.findOne({ _id: id, deleted: false });
  if (!user) throw { status: 404, message: "Không tìm thấy người dùng" };

  user.status = status as UserStatus;
  await user.save();
  return { _id: user._id, username: user.username, email: user.email, status: user.status };
};

// ── User (self) ─────────────────────────────────────────────────────────────

export const updateMe = async (userId: string, updateData: any) => {
  return User.findOneAndUpdate({ _id: userId }, updateData, { new: true }).select("-password -refreshToken");
};

export const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await User.findOne({ _id: userId, deleted: false, status: UserStatus.ACTIVE });
  if (!user) throw { status: 400, message: "Tài khoản không tồn tại!" };

  const isOldPasswordCorrect = await comparePassword(oldPassword, user.password);
  if (!isOldPasswordCorrect) throw { status: 400, message: "Mật khẩu cũ không chính xác!" };

  const isSamePassword = await comparePassword(newPassword, user.password);
  if (isSamePassword) throw { status: 400, message: "Mật khẩu mới không được giống mật khẩu cũ!" };

  user.password = await hashPassword(newPassword);
  await user.save();
};