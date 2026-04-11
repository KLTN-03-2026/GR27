import { Request, Response } from "express";
import User from "../models/user.model";
import { hashPassword, comparePassword } from "../../../helpers/password";
import { UserStatus, UserRole } from "../../../types/user.type";

// --- ADMIN ---
//[GET] LIST: /api/v1/users
export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    // Pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    let query: any = { deleted: false };

    // Search by username or email
    if (req.query.keyword) {
      const keyword = req.query.keyword as string;
      query.$or = [
        { username: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        { fullname: { $regex: keyword, $options: "i" } }
      ];
    }

    // Filter by role
    if (req.query.role) {
      if (Object.values(UserRole).includes(req.query.role as UserRole)) {
        query.role = req.query.role;
      }
    }

    // Filter by status
    if (req.query.status) {
      if (Object.values(UserStatus).includes(req.query.status as UserStatus)) {
        query.status = req.query.status;
      }
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get paginated data
    const users = await User.find(query)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//[GET] DETAIL: /api/v1/users/:id
export const detail = async (req: Request, res: Response): Promise<void> => {
  try {
    const id: string = req.params.id;
    const user = await User.findById(id).select("-password -refreshToken");
    if (!user) {
      res.status(404).json({ message: "Không tìm thấy user" });
      return;
    }
    res.json({ code: 200, message: "Thành công", user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//[PATCH] UPDATE ROLE: /api/v1/users/:id/role
export const updateRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Kiểm tra role hợp lệ
    if (!role || !Object.values(UserRole).includes(role)) {
      res.status(400).json({
        code: 400,
        message: "Role không hợp lệ. Chỉ chấp nhận 'user' hoặc 'admin'",
      });
      return;
    }

    // Không cho phép admin tự thay đổi role của chính mình
    if (id === req.user._id.toString()) {
      res.status(403).json({
        code: 403,
        message: "Bạn không thể thay đổi role của chính mình",
      });
      return;
    }

    // Tìm và cập nhật user
    const user = await User.findOne({ _id: id, deleted: false });
    if (!user) {
      res.status(404).json({
        code: 404,
        message: "Không tìm thấy người dùng",
      });
      return;
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      code: 200,
      message: "Cập nhật role thành công",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//[PATCH] UPDATE STATUS: /api/v1/users/:id/status
export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Kiểm tra status hợp lệ
    if (!status || !Object.values(UserStatus).includes(status)) {
      res.status(400).json({
        code: 400,
        message: "Status không hợp lệ. Chỉ chấp nhận 'active', 'blocked', hoặc 'pending'",
      });
      return;
    }

    // Không cho phép admin tự thay đổi status của chính mình
    if (id === req.user._id.toString()) {
      res.status(403).json({
        code: 403,
        message: "Bạn không thể thay đổi trạng thái của chính mình",
      });
      return;
    }

    // Tìm và cập nhật user
    const user = await User.findOne({ _id: id, deleted: false });
    if (!user) {
      res.status(404).json({
        code: 404,
        message: "Không tìm thấy người dùng",
      });
      return;
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      code: 200,
      message: "Cập nhật trạng thái thành công",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// --- USER ---
//[GET] DETAIL: /api/v1/users/me
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ code: 200, message: "Thành công", user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [PATCH] EDIT: /api/v1/users/me
export const edit = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.user._id },
      req.body,
      { new: true }
    ).select("-password -refreshToken");
    
    res.json({ code: 200, message: "Cập nhật thành công", user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//[PATCH] /api/v1/users/me/change-password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findOne({ _id: req.user._id, deleted: false, status: UserStatus.ACTIVE });
    
    if (!user) {
      res.status(400).json({ code: 400, message: "Tài khoản không tồn tại!" });
      return;
    }
    
    // Dùng bcrypt để so sánh password cũ
    const isOldPasswordCorrect = await comparePassword(oldPassword, user.password);
    if (!isOldPasswordCorrect) {
      res.status(400).json({ code: 400, message: "Mật khẩu cũ không chính xác!" });
      return;
    }
    
    // Kiểm tra password mới có giống password cũ không
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      res.status(400).json({ code: 400, message: "Mật khẩu mới không được giống mật khẩu cũ!" });
      return;
    }
    
    // Hash password mới và lưu vào database
    user.password = await hashPassword(newPassword);
    await user.save();
    
    res.status(200).json({ code: 200, message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};