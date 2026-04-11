import { Request, Response } from "express";
import Comment from "../models/comment.model";
import Film from "../models/film.model";
import { ICommentCreate, ICommentUpdate } from "../../../types/comment.type";
import { UserRole } from "../../../types/user.type";
import { CommonStatus } from "../../../types/common.type";

// [GET] LIST ALL COMMENTS (ADMIN): /api/v1/comments
// Query params: ?page=1&limit=10&isReported=true&filmId=xxx&userId=xxx&rate=5&keyword=xxx
export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    // Pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    let query: any = {};

    // Filter by isReported nếu có
    if (req.query.isReported !== undefined) {
      query.isReported = req.query.isReported === "true";
    }

    // Filter by filmId nếu có
    if (req.query.filmId) {
      query.filmId = req.query.filmId;
    }

    // Filter by userId nếu có
    if (req.query.userId) {
      query.userId = req.query.userId;
    }

    // Filter by rate nếu có
    if (req.query.rate) {
      const rate = parseInt(req.query.rate as string);
      if (rate >= 1 && rate <= 5) {
        query.rate = rate;
      }
    }

    // Search by content (keyword)
    if (req.query.keyword) {
      query.content = { $regex: req.query.keyword, $options: "i" };
    }

    // Get total count
    const total = await Comment.countDocuments(query);

    // Get paginated data
    const comments = await Comment.find(query)
      .populate({ path: "userId", select: "username avatar email" })
      .populate({ path: "filmId", select: "title slug thumbnail" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [GET] COMMENTS BY FILM SLUG (PUBLIC): /api/v1/comments/film/:slug
export const getByFilmId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Tìm film theo id
    const film = await Film.findOne({
      _id: id,
      status: CommonStatus.ACTIVE,
      deleted: false,
    });

    if (!film) {
      res.status(404).json({
        message: "Không tìm thấy phim!",
      });
      return;
    }

    // Lấy comments của film
    const query = {
      filmId: film._id,
    };

    const total = await Comment.countDocuments(query);

    const comments = await Comment.find(query)
      .populate({ path: "userId", select: "username avatar" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get comments by film error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [POST] CREATE COMMENT (USER): /api/v1/comments
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const createData = req.body as ICommentCreate;

    // Kiểm tra film có tồn tại không
    const film = await Film.findOne({
      _id: createData.filmId,
      deleted: false,
    });

    if (!film) {
      res.status(404).json({ message: "Không tìm thấy phim" });
      return;
    }

    // Kiểm tra người dùng đã bình luận phim này hay chưa
    const hasCommented = await Comment.findOne({
      filmId: createData.filmId,
      userId: req.user!._id,
    });

    if (hasCommented) {
      res.status(400).json({ message: "Bạn đã đánh giá phim này rồi" });
      return;
    }

    // Gán userId từ req.user
    const commentData = {
      ...createData,
      userId: req.user!._id,
    };

    const comment = await Comment.create(commentData);

    // Populate để trả về thông tin đầy đủ
    const populatedComment = await Comment.findById(comment._id)
      .populate({ path: "userId", select: "username avatar" })
      .populate({ path: "filmId", select: "title slug" });

    res.status(201).json({
      code: 201,
      message: "Tạo bình luận thành công",
      data: populatedComment,
    });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [PATCH] UPDATE COMMENT (USER - OWN COMMENT): /api/v1/comments/:id
export const edit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body as ICommentUpdate;

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({ message: "Không tìm thấy bình luận" });
      return;
    }

    // Kiểm tra user chỉ được sửa comment của chính mình
    if (comment.userId.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        code: 403,
        message: "Bạn không có quyền sửa bình luận này",
      });
      return;
    }

    // Chỉ cho phép update rate và content
    const allowedFields: ICommentUpdate = {};
    if (updateData.rate !== undefined) allowedFields.rate = updateData.rate;
    if (updateData.content !== undefined)
      allowedFields.content = updateData.content;

    const updatedComment = await Comment.findByIdAndUpdate(id, allowedFields, {
      new: true,
    })
      .populate({ path: "userId", select: "username avatar" })
      .populate({ path: "filmId", select: "title slug" });

    res.status(200).json({
      code: 200,
      message: "Cập nhật bình luận thành công",
      data: updatedComment,
    });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [DELETE] DELETE COMMENT (USER - OWN COMMENT or ADMIN): /api/v1/comments/:id
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({ message: "Không tìm thấy bình luận" });
      return;
    }

    await Comment.findByIdAndDelete(id);

    res.status(200).json({
      code: 200,
      message: "Xóa bình luận thành công",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [PATCH] REPORT COMMENT (USER ONLY): /api/v1/comments/:id/report
export const report = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({ message: "Không tìm thấy bình luận" });
      return;
    }

    // Người dùng không thể báo cáo bình luận của chính mình
    if (comment.userId.toString() === currentUser._id.toString()) {
      res.status(403).json({
        code: 403,
        message: "Bạn không thể báo cáo bình luận của chính mình",
      });
      return;
    }

    // Nếu bình luận đã được báo cáo rồi
    if (comment.isReported) {
      res.status(200).json({
        code: 200,
        message: "Bình luận này đã được báo cáo trước đó",
        data: comment,
      });
      return;
    }

    // Đánh dấu bình luận là đã bị báo cáo
    comment.isReported = true;
    await comment.save();

    const populatedComment = await Comment.findById(id)
      .populate({ path: "userId", select: "username avatar" })
      .populate({ path: "filmId", select: "title slug" });

    res.status(200).json({
      code: 200,
      message: "Báo cáo bình luận thành công",
      data: populatedComment,
    });
  } catch (error) {
    console.error("Report comment error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [PATCH] UNREPORT COMMENT (ADMIN ONLY): /api/v1/comments/:id/unreport
export const unreport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({ message: "Không tìm thấy bình luận" });
      return;
    }

    // Nếu bình luận chưa bị báo cáo
    if (!comment.isReported) {
      res.status(400).json({
        code: 400,
        message: "Bình luận này chưa bị báo cáo",
      });
      return;
    }

    // Gỡ trạng thái báo cáo
    comment.isReported = false;
    await comment.save();

    const populatedComment = await Comment.findById(id)
      .populate({ path: "userId", select: "username avatar" })
      .populate({ path: "filmId", select: "title slug" });

    res.status(200).json({
      code: 200,
      message: "Gỡ báo cáo bình luận thành công",
      data: populatedComment,
    });
  } catch (error) {
    console.error("Unreport comment error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
