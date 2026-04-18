import Cinema from "../models/cinema.model";
import ShowTime from "../models/showTime.model";
import { ICinemaCreate, ICinemaUpdate } from "../../../types/cinema.type";
import { UserRole } from "../../../types/user.type";
import { CommonStatus } from "../../../types/common.type";

export const getAllCinemas = async (userRole?: string) => {
  const isAdmin = userRole === UserRole.ADMIN;

  const query = isAdmin
    ? { deleted: false }
    : { status: CommonStatus.ACTIVE, deleted: false };

  return Cinema.find(query)
    .populate({ path: "parentId", select: "name avatar" })
    .populate({ path: "cityIds", select: "name" })
    .sort({ createdAt: -1 });
};

export const getCinemaBySlug = async (slug: string) => {
  const cinema = await Cinema.findOne({ slug, status: CommonStatus.ACTIVE, deleted: false })
    .populate({ path: "cityIds", select: "name" })
    .populate({ path: "parentId", select: "name" });

  if (!cinema) throw { status: 404, message: "Rạp chiếu không tồn tại hoặc chưa được công bố" };
  return cinema;
};

export const getCinemaById = async (id: string) => {
  const cinema = await Cinema.findOne({ _id: id, deleted: false })
    .populate({ path: "cityIds", select: "name" })
    .populate({ path: "parentId", select: "name avatar" });

  if (!cinema) throw { status: 404, message: "Không tìm thấy rạp chiếu" };
  return cinema;
};

export const createCinema = async (data: ICinemaCreate) => {
  return Cinema.create(data);
};

export const updateCinema = async (id: string, data: ICinemaUpdate) => {
  const cinema = await Cinema.findByIdAndUpdate(id, data, { new: true });
  if (!cinema) throw { status: 404, message: "Không tìm thấy rạp chiếu" };
  return cinema;
};

export const deleteCinema = async (id: string) => {
  const hasUpcomingShowtimes = await ShowTime.exists({
    cinemaId: id,
    deleted: false,
    startTime: { $gte: new Date() },
  });

  if (hasUpcomingShowtimes) {
    throw { status: 400, message: "Không thể xóa rạp khi còn suất chiếu sắp tới" };
  }

  const cinema = await Cinema.findById(id);
  if (!cinema) throw { status: 404, message: "Không tìm thấy rạp chiếu" };

  cinema.deleted = true;
  await cinema.save();
};