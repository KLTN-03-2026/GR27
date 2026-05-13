import Cinema from "../models/cinema.model";
import ShowTime from "../models/showTime.model";
import Room from "../models/room.model";
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
    const existing = await Cinema.findOne({
    name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
    deleted: false,
  });

  if (existing) {
    throw {
      status: 409,
      message: `Rạp "${data.name}" đã tồn tại trong hệ thống`,
    };
  }
  return Cinema.create(data);
};

export const updateCinema = async (id: string, data: ICinemaUpdate) => {
    if (data.name) {
    const existing = await Cinema.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
      deleted: false,
    });

    if (existing) {
      throw {
        status: 409,
        message: `Rạp "${data.name}" đã tồn tại trong hệ thống`,
      };
    }
  }
  const cinema = await Cinema.findByIdAndUpdate(id, data, { new: true });
  if (!cinema) throw { status: 404, message: "Không tìm thấy rạp chiếu" };
  return cinema;
};

// Xóa mềm
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
  if (cinema.deleted) throw { status: 400, message: "Rạp chiếu đã bị xóa trước đó" };

  cinema.deleted = true;
  await cinema.save();
};

// ── Trash ────────────────────────────────────────────────────────────────────

export const getTrashedCinemas = async () => {
  return Cinema.find({ deleted: true })
    .populate({ path: "parentId", select: "name avatar" })
    .populate({ path: "cityIds", select: "name" })
    .sort({ updatedAt: -1 });
};

// Xóa vĩnh viễn — check kỹ trước khi xóa
export const permanentDeleteCinema = async (id: string) => {
  const cinema = await Cinema.findOne({ _id: id, deleted: true });
  if (!cinema) throw { status: 404, message: "Không tìm thấy rạp chiếu trong thùng rác" };

  // Check room — kể cả deleted, vì room đang tham chiếu cinemaId này
  const roomCount = await Room.countDocuments({ cinemaId: id });
  if (roomCount > 0) {
    throw {
      status: 400,
      message: `Không thể xóa vĩnh viễn. Rạp đang được tham chiếu bởi ${roomCount} phòng chiếu (kể cả đã xóa).`,
    };
  }

  // Check showtime — kể cả deleted, vì order vẫn đang tham chiếu showtime đó
  const showtimeCount = await ShowTime.countDocuments({ cinemaId: id });
  if (showtimeCount > 0) {
    throw {
      status: 400,
      message: `Không thể xóa vĩnh viễn. Rạp đang được tham chiếu bởi ${showtimeCount} suất chiếu (kể cả đã xóa). Dữ liệu đơn hàng có thể bị ảnh hưởng.`,
    };
  }

  await Cinema.findByIdAndDelete(id);
};