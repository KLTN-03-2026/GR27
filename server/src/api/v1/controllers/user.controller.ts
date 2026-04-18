import { Request, Response } from "express";
import * as userService from "../services/user.service";

// ── Admin ───────────────────────────────────────────────────────────────────

// [GET] /api/v1/users
export const index = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const { keyword, role, status } = req.query as Record<string, string>;

  const result = await userService.getUsers({ page, limit, keyword, role, status });

  res.status(200).json({
    code: 200,
    message: "Thành công",
    data: result.users,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
};

// [GET] /api/v1/users/:id
export const detail = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.getUserById(req.params.id);
  res.json({ code: 200, message: "Thành công", user });
};

// [PATCH] /api/v1/users/:id/role
export const updateRole = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.updateUserRole(
    req.params.id,
    req.body.role,
    req.user._id.toString()
  );
  res.status(200).json({ code: 200, message: "Cập nhật role thành công", user });
};

// [PATCH] /api/v1/users/:id/status
export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.updateUserStatus(
    req.params.id,
    req.body.status,
    req.user._id.toString()
  );
  res.status(200).json({ code: 200, message: "Cập nhật trạng thái thành công", user });
};

// ── User (self) ─────────────────────────────────────────────────────────────

// [GET] /api/v1/users/me
export const me = async (req: Request, res: Response): Promise<void> => {
  res.json({ code: 200, message: "Thành công", user: req.user });
};

// [PATCH] /api/v1/users/me
export const edit = async (req: Request, res: Response): Promise<void> => {
  const user = await userService.updateMe(req.user._id.toString(), req.body);
  res.json({ code: 200, message: "Cập nhật thành công", user });
};

// [PATCH] /api/v1/users/me/change-password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { oldPassword, newPassword } = req.body;
  await userService.changePassword(req.user._id.toString(), oldPassword, newPassword);
  res.status(200).json({ code: 200, message: "Đổi mật khẩu thành công!" });
};