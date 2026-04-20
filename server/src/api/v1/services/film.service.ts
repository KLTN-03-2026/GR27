import Film from "../models/film.model";
import ShowTime from "../models/showTime.model";
import Comment from "../models/comment.model";
import { IFilmCreate, IFilmUpdate } from "../../../types/film.type";
import { CommonStatus } from "../../../types/common.type";
import { UserRole } from "../../../types/user.type";

export const getAllFilms = async (userRole?: string) => {
  const isAdmin = userRole === UserRole.ADMIN;

  const query: any = { deleted: false };
  if (!isAdmin) query.status = CommonStatus.ACTIVE;

  const films = await Film.find(query)
    .populate({ path: "categoryIds", select: "title" })
    .sort({ createdAt: -1 });

  if (!films || films.length === 0) {
    throw {
      status: 404,
      message: isAdmin ? "Không tìm thấy film nào" : "Không có film nào công khai",
    };
  }

  return films;
};

export const getFilmBySlug = async (slug: string) => {
  const film = await Film.findOne({
    slug,
    status: CommonStatus.ACTIVE,
    deleted: false,
  }).populate({ path: "categoryIds", select: "title" });

  if (!film) throw { status: 404, message: "Film không tồn tại hoặc chưa được công bố" };
  return film;
};

export const getFilmById = async (id: string) => {
  const film = await Film.findOne({ _id: id, deleted: false })
    .populate({ path: "categoryIds", select: "title" });

  if (!film) throw { status: 404, message: "Không tìm thấy film" };
  return film;
};

export const createFilm = async (data: IFilmCreate) => {
  return Film.create(data);
};

export const updateFilm = async (id: string, data: IFilmUpdate) => {
  const film = await Film.findByIdAndUpdate(id, data, { new: true });
  if (!film) throw { status: 404, message: "Không tìm thấy film" };
  return film;
};

// Xóa mềm
export const deleteFilm = async (id: string) => {
  const film = await Film.findById(id);
  if (!film) throw { status: 404, message: "Không tìm thấy film" };
  if (film.deleted) throw { status: 400, message: "Film đã bị xóa trước đó" };

  film.deleted = true;
  await film.save();
};

// ── Trash ────────────────────────────────────────────────────────────────────

export const getTrashedFilms = async () => {
  return Film.find({ deleted: true })
    .populate({ path: "categoryIds", select: "title" })
    .sort({ updatedAt: -1 });
};

// Xóa vĩnh viễn — check kỹ trước khi xóa
export const permanentDeleteFilm = async (id: string) => {
  const film = await Film.findOne({ _id: id, deleted: true });
  if (!film) throw { status: 404, message: "Không tìm thấy film trong thùng rác" };

  // Check showtime — kể cả deleted showtime vì order vẫn đang tham chiếu
  const showtimeCount = await ShowTime.countDocuments({ filmId: id });
  if (showtimeCount > 0) {
    throw {
      status: 400,
      message: `Không thể xóa vĩnh viễn. Film đang được tham chiếu bởi ${showtimeCount} suất chiếu (kể cả đã xóa). Dữ liệu đơn hàng có thể bị ảnh hưởng.`,
    };
  }

  // Comment không ảnh hưởng tới order → cascade delete
  await Comment.deleteMany({ filmId: id });
  await Film.findByIdAndDelete(id);
};