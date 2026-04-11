import { get, post, del, patch } from "../utils";
import { API_ENDPOINTS } from "../constants";
export const getCommentByFilmId = (filmId) => get(API_ENDPOINTS.COMMENTS.BY_FILM(filmId));
/*
Cấu trúc database nhận về như này
    // Get paginated data
    const comments = await Comment.find(query)
      .populate({ path: "userId", select: "username avatar" })
      .populate({ path: "filmId", select: "title slug" })
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
*/
export const createComment = (data) => post(API_ENDPOINTS.COMMENTS.CREATE, data);
// Cấu trúc data gửi đi như này
/* 
  {
  "userId": id người dùng,
  "filmId": id phim,
  "rate": 5,
  "content": "Kỹ xảo mãn nhãn, những cảnh hành động trên không thực sự nghẹt thở. Một bộ phim đáng xem ngoài rạp!",
}
 */
export const deleteComment = (commentId) => del(API_ENDPOINTS.COMMENTS.DELETE(commentId));

export const updateComment = (commentId, data) => patch(API_ENDPOINTS.COMMENTS.UPDATE(commentId), data);

export const reportComment = (commentId) => patch(API_ENDPOINTS.COMMENTS.REPORT(commentId));

export const unReportComment = (commentId) => patch(API_ENDPOINTS.COMMENTS.UNREPORT(commentId));
