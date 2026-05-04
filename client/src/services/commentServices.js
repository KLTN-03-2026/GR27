// src/services/commentServices.js
import { get, post, del, patch } from "../utils";
import { API_ENDPOINTS } from "../constants";

/**
 * Lấy danh sách bình luận theo filmId (có phân trang).
 * Response shape:
 * {
 *   data: Comment[],
 *   pagination: { page, limit, total, totalPages }
 * }
 * Mỗi comment có: _id, userId: { _id, username, avatar }, filmId, rate, content, isReported, createdAt, updatedAt
 */
export const getCommentByFilmId = (filmId, page = 1) =>
  get(`${API_ENDPOINTS.COMMENTS.BY_FILM(filmId)}?page=${page}`);

/**
 * Tạo bình luận mới.
 * Body: { filmId, rate, content }
 * (userId được lấy từ token bên BE)
 */
export const createComment = (data) => post(API_ENDPOINTS.COMMENTS.CREATE, data);

/**
 * Xóa bình luận theo id (chỉ bình luận của chính user hoặc admin).
 */
export const deleteComment = (commentId) =>
  del(API_ENDPOINTS.COMMENTS.DELETE(commentId));

/**
 * Cập nhật bình luận theo id (chỉ bình luận của chính user).
 * Body: { rate?, content? }
 */
export const updateComment = (commentId, data) =>
  patch(API_ENDPOINTS.COMMENTS.UPDATE(commentId), data);

/**
 * Báo cáo bình luận của người khác.
 */
export const reportComment = (commentId) =>
  patch(API_ENDPOINTS.COMMENTS.REPORT(commentId));

/**
 * Gỡ báo cáo bình luận (admin only).
 */
export const unReportComment = (commentId) =>
  patch(API_ENDPOINTS.COMMENTS.UNREPORT(commentId));