import { Request, Response } from "express";
import * as commentService from "../services/comment.service";
import { ICommentCreate, ICommentUpdate } from "../../../types/comment.type";

// [GET] /api/v1/comments  (admin)
export const index = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, isReported, filmId, userId, rate, keyword } = req.query as Record<string, string>;

  const result = await commentService.getComments({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    isReported,
    filmId,
    userId,
    rate,
    keyword,
  });

  res.status(200).json({
    code: 200,
    message: "Thành công",
    data: result.comments,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
};

// [GET] /api/v1/comments/film/:id  (public)
export const getByFilmId = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const result = await commentService.getCommentsByFilmId(req.params.id, page);

  res.status(200).json({
    code: 200,
    message: "Thành công",
    data: result.comments,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
};

// [POST] /api/v1/comments  (user)
export const create = async (req: Request, res: Response): Promise<void> => {
  const comment = await commentService.createComment(
    req.body as ICommentCreate,
    req.user!._id.toString()
  );
  res.status(201).json({ code: 201, message: "Tạo bình luận thành công", data: comment });
};

// [PATCH] /api/v1/comments/:id  (user - own comment)
export const edit = async (req: Request, res: Response): Promise<void> => {
  const comment = await commentService.updateComment(
    req.params.id,
    req.body as ICommentUpdate,
    req.user!._id.toString()
  );
  res.status(200).json({ code: 200, message: "Cập nhật bình luận thành công", data: comment });
};

// [DELETE] /api/v1/comments/:id  (user - own comment | admin - any comment)
export const remove = async (req: Request, res: Response): Promise<void> => {
  await commentService.deleteComment(
    req.params.id,
    req.user!._id.toString(),
    req.user!.role
  );
  res.status(200).json({ code: 200, message: "Xóa bình luận thành công" });
};

// [PATCH] /api/v1/comments/:id/report  (user)
export const report = async (req: Request, res: Response): Promise<void> => {
  const result = await commentService.reportComment(req.params.id, req.user!._id.toString());

  if (result.alreadyReported) {
    res.status(200).json({ code: 200, message: "Bình luận này đã được báo cáo trước đó", data: result.comment });
    return;
  }

  res.status(200).json({ code: 200, message: "Báo cáo bình luận thành công", data: result.comment });
};

// [PATCH] /api/v1/comments/:id/unreport  (admin)
export const unreport = async (req: Request, res: Response): Promise<void> => {
  const comment = await commentService.unreportComment(req.params.id);
  res.status(200).json({ code: 200, message: "Gỡ báo cáo bình luận thành công", data: comment });
};