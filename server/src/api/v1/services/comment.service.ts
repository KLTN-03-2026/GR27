import Comment from "../models/comment.model";
import Film from "../models/film.model";
import Order, { OrderStatus, PaymentStatus } from "../models/order.model";
import ShowTime from "../models/showTime.model";
import { ICommentCreate, ICommentUpdate } from "../../../types/comment.type";
import { CommonStatus } from "../../../types/common.type";
import { UserRole } from "../../../types/user.type";

// Populate dùng chung
const COMMENT_POPULATE = [
  { path: "userId", select: "username avatar" },
  { path: "filmId", select: "title slug" },
];

const COMMENT_POPULATE_WITH_EMAIL = [
  { path: "userId", select: "username avatar email" },
  { path: "filmId", select: "title slug thumbnail" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Kiểm tra user đã từng mua vé thành công của bộ phim này chưa.
 * Logic: Order (confirmed + paid) → ShowTime → filmId khớp
 */
const hasUserPurchasedFilm = async (userId: string, filmId: string): Promise<boolean> => {
  // Lấy tất cả showtime của film này
  const showtimeIds = await ShowTime.find({ filmId, deleted: false }).distinct("_id");

  if (showtimeIds.length === 0) return false;

  const purchasedOrder = await Order.exists({
    userId,
    showtimeId: { $in: showtimeIds },
    orderStatus: OrderStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PAID,
    deleted: false,
  });

  return !!purchasedOrder;
};

// ── Service functions ────────────────────────────────────────────────────────

export interface IGetCommentsQuery {
  page?: number;
  limit?: number;
  isReported?: string;
  filmId?: string;
  userId?: string;
  rate?: string;
  keyword?: string;
}

export const getComments = async ({ page = 1, limit = 10, isReported, filmId, userId, rate, keyword }: IGetCommentsQuery) => {
  const skip = (page - 1) * limit;
  const query: any = {};

  if (isReported !== undefined) query.isReported = isReported === "true";
  if (filmId) query.filmId = filmId;
  if (userId) query.userId = userId;
  if (rate) {
    const rateNum = parseInt(rate);
    if (rateNum >= 1 && rateNum <= 5) query.rate = rateNum;
  }
  if (keyword) query.content = { $regex: keyword, $options: "i" };

  const [total, comments] = await Promise.all([
    Comment.countDocuments(query),
    Comment.find(query)
      .populate(COMMENT_POPULATE_WITH_EMAIL)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return { comments, total, page, limit };
};

export const getCommentsByFilmId = async (filmId: string, page = 1) => {
  const limit = 10;
  const skip = (page - 1) * limit;

  const film = await Film.findOne({ _id: filmId, status: CommonStatus.ACTIVE, deleted: false });
  if (!film) throw { status: 404, message: "Không tìm thấy phim!" };

  const query = { filmId: film._id };

  const [total, comments] = await Promise.all([
    Comment.countDocuments(query),
    Comment.find(query)
      .populate({ path: "userId", select: "username avatar" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return { comments, total, page, limit };
};

export const createComment = async (data: ICommentCreate, userId: string) => {
  const film = await Film.findOne({ _id: data.filmId, deleted: false });
  if (!film) throw { status: 404, message: "Không tìm thấy phim" };

  // Kiểm tra user đã mua vé thành công của phim này chưa
  const hasPurchased = await hasUserPurchasedFilm(userId, data.filmId.toString());
  if (!hasPurchased) {
    throw {
      status: 403,
      message: "Bạn chỉ có thể đánh giá phim sau khi đã mua vé xem phim này trên hệ thống",
    };
  }

  // Kiểm tra đã comment phim này chưa
  const hasCommented = await Comment.exists({ filmId: data.filmId, userId });
  if (hasCommented) throw { status: 400, message: "Bạn đã đánh giá phim này rồi" };

  const comment = await Comment.create({ ...data, userId });

  return Comment.findById(comment._id).populate(COMMENT_POPULATE);
};

export const updateComment = async (id: string, data: ICommentUpdate, userId: string) => {
  const comment = await Comment.findById(id);
  if (!comment) throw { status: 404, message: "Không tìm thấy bình luận" };

  if (comment.userId.toString() !== userId) {
    throw { status: 403, message: "Bạn không có quyền sửa bình luận này" };
  }

  // Chỉ cho phép update rate và content
  const allowedUpdate: ICommentUpdate = {};
  if (data.rate !== undefined) allowedUpdate.rate = data.rate;
  if (data.content !== undefined) allowedUpdate.content = data.content;

  return Comment.findByIdAndUpdate(id, allowedUpdate, { new: true })
    .populate(COMMENT_POPULATE);
};

export const deleteComment = async (id: string, userId: string, userRole: string) => {
  const comment = await Comment.findById(id);
  if (!comment) throw { status: 404, message: "Không tìm thấy bình luận" };

  const isAdmin = userRole === UserRole.ADMIN;
  const isOwner = comment.userId.toString() === userId;

  // Admin xóa được tất cả, user chỉ xóa được của chính mình
  if (!isAdmin && !isOwner) {
    throw { status: 403, message: "Bạn không có quyền xóa bình luận này" };
  }

  await Comment.findByIdAndDelete(id);
};

export const reportComment = async (id: string, userId: string) => {
  const comment = await Comment.findById(id);
  if (!comment) throw { status: 404, message: "Không tìm thấy bình luận" };

  if (comment.userId.toString() === userId) {
    throw { status: 403, message: "Bạn không thể báo cáo bình luận của chính mình" };
  }

  if (comment.isReported) {
    return { alreadyReported: true, comment };
  }

  comment.isReported = true;
  await comment.save();

  return { alreadyReported: false, comment: await Comment.findById(id).populate(COMMENT_POPULATE) };
};

export const unreportComment = async (id: string) => {
  const comment = await Comment.findById(id);
  if (!comment) throw { status: 404, message: "Không tìm thấy bình luận" };

  if (!comment.isReported) {
    throw { status: 400, message: "Bình luận này chưa bị báo cáo" };
  }

  comment.isReported = false;
  await comment.save();

  return Comment.findById(id).populate(COMMENT_POPULATE);
};