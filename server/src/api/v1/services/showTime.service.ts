import mongoose from "mongoose";
import ShowTime from "../models/showTime.model";
import Room from "../models/room.model";
import Film from "../models/film.model";
import Cinema from "../models/cinema.model";
import { IShowTimeCreate, IShowTimeUpdate, ShowTimeSeatStatus } from "../../../types/showTime.type";
import { CommonStatus } from "../../../types/common.type";
import { UserRole } from "../../../types/user.type";

// ── Helpers nội bộ ────────────────────────────────────────────────────────────

const checkTimeConflict = async (
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string
): Promise<boolean> => {
  const query: any = {
    roomId,
    deleted: false,
    $or: [
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
    ],
  };
  if (excludeId) query._id = { $ne: excludeId };

  return !!(await ShowTime.findOne(query));
};

const hasBookedSeats = (seats: any[]): boolean =>
  seats.some((s) => s.status === ShowTimeSeatStatus.BOOKED);

const snapshotSeats = (seatLayout: any[]) =>
  seatLayout.map((seat) => ({
    row: seat.row,
    number: seat.number,
    type: seat.type,
    seatKey: seat.seatKey,
    partnerSeatKey: seat.partnerSeatKey,
    status: ShowTimeSeatStatus.AVAILABLE,
  }));

// ── Service functions ────────────────────────────────────────────────────────

export interface IGetShowTimesQuery {
  page?: number;
  isAdmin?: boolean;
  status?: string;
  filmId?: string;
  cinemaId?: string;
  roomId?: string;
  startDate?: string;
  endDate?: string;
}

export const getShowTimes = async ({ page = 1, isAdmin = false, status, filmId, cinemaId, roomId, startDate, endDate }: IGetShowTimesQuery) => {
  const limit = 10;
  const skip = (page - 1) * limit;
  const query: any = { deleted: false };

  if (status && Object.values(CommonStatus).includes(status as CommonStatus)) {
    query.status = status;
  } else if (!isAdmin) {
    query.status = CommonStatus.ACTIVE;
  }

  if (filmId) query.filmId = filmId;
  if (cinemaId) query.cinemaId = cinemaId;
  if (roomId) query.roomId = roomId;

  if (startDate || endDate) {
    query.startTime = {};
    if (startDate) query.startTime.$gte = new Date(startDate);
    if (endDate) query.startTime.$lte = new Date(endDate);
  }

  const [total, showtimes] = await Promise.all([
    ShowTime.countDocuments(query),
    ShowTime.find(query)
      .populate({ path: "filmId", select: "title" })
      .populate({ path: "cinemaId", select: "name address" })
      .populate({ path: "roomId", select: "name" })
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit),
  ]);

  return { showtimes, total, page, limit };
};

export const getShowTimeById = async (id: string, isAdmin = false) => {
  const query: any = { _id: id, deleted: false };
  if (!isAdmin) query.status = CommonStatus.ACTIVE;

  const showtime = await ShowTime.findOne(query)
    .populate({ path: "filmId", select: "title thumbnail duration description actors directors ageRating" })
    .populate({ path: "cinemaId", select: "name address avatar" })
    .populate({ path: "roomId", select: "name supportedFormats" });

  if (!showtime) throw { status: 404, message: "Không tìm thấy suất chiếu" };
  return showtime;
};

export const createShowTime = async (data: IShowTimeCreate) => {
  // 1. Validate room
  const room = await Room.findOne({ _id: data.roomId, deleted: false });
  if (!room) throw { status: 404, message: "Không tìm thấy phòng chiếu" };

  // 2. Validate cinema khớp room
  if (data.cinemaId.toString() !== room.cinemaId.toString()) {
    throw { status: 400, message: "Rạp chiếu không khớp với rạp chứa phòng này" };
  }

  // 3. Validate film
  const film = await Film.findOne({ _id: data.filmId, deleted: false });
  if (!film) throw { status: 404, message: "Không tìm thấy phim" };

  // 4. Validate cinema
  const cinema = await Cinema.findOne({ _id: data.cinemaId, deleted: false });
  if (!cinema) throw { status: 404, message: "Không tìm thấy rạp chiếu" };

  // 5. Validate format film
  if (!film.availableFormats.includes(data.format)) {
    throw {
      status: 400,
      message: `Phim "${film.title}" không hỗ trợ định dạng ${data.format}. Các định dạng khả dụng: ${film.availableFormats.join(", ")}`,
    };
  }

  // 6. Validate format room
  if (!room.supportedFormats.includes(data.format)) {
    throw {
      status: 400,
      message: `Phòng ${room.name} không hỗ trợ định dạng ${data.format}. Các định dạng khả dụng: ${room.supportedFormats.join(", ")}`,
    };
  }

  // 7. Kiểm tra xung đột thời gian
  const hasConflict = await checkTimeConflict(data.roomId.toString(), data.startTime, data.endTime);
  if (hasConflict) throw { status: 400, message: "Khoảng thời gian này bị trùng với suất chiếu khác trong cùng phòng" };

  // 8. Snapshot seats từ room
  return ShowTime.create({ ...data, seats: snapshotSeats(room.seatLayout) });
};

export const updateShowTime = async (id: string, data: IShowTimeUpdate) => {
  const current = await ShowTime.findOne({ _id: id, deleted: false });
  if (!current) throw { status: 404, message: "Không tìm thấy suất chiếu" };

  if (hasBookedSeats(current.seats)) {
    throw { status: 400, message: "Không thể sửa suất chiếu đã có người đặt vé" };
  }

  let needResnapSeat = false;

  // Validate đổi roomId
  if (data.roomId && data.roomId.toString() !== current.roomId.toString()) {
    needResnapSeat = true;
    const newRoom = await Room.findOne({ _id: data.roomId, deleted: false });
    if (!newRoom) throw { status: 404, message: "Không tìm thấy phòng chiếu mới" };

    const targetCinemaId = data.cinemaId || current.cinemaId;
    if (targetCinemaId.toString() !== newRoom.cinemaId.toString()) {
      throw { status: 400, message: "Rạp chiếu không khớp với rạp chứa phòng mới" };
    }

    const targetFormat = data.format || current.format;
    if (!newRoom.supportedFormats.includes(targetFormat)) {
      throw {
        status: 400,
        message: `Phòng ${newRoom.name} không hỗ trợ định dạng ${targetFormat}. Các định dạng khả dụng: ${newRoom.supportedFormats.join(", ")}`,
      };
    }
  }

  // Validate đổi cinemaId mà không đổi roomId
  if (data.cinemaId && !data.roomId) {
    const currentRoom = await Room.findById(current.roomId);
    if (currentRoom && data.cinemaId.toString() !== currentRoom.cinemaId.toString()) {
      throw { status: 400, message: "Không thể đổi rạp mà không đổi phòng. Phòng hiện tại thuộc rạp khác." };
    }
  }

  // Validate format mới
  if (data.format) {
    const targetFilmId = data.filmId || current.filmId;
    const film = await Film.findOne({ _id: targetFilmId, deleted: false });
    if (!film) throw { status: 404, message: "Không tìm thấy phim" };

    if (!film.availableFormats.includes(data.format)) {
      throw {
        status: 400,
        message: `Phim "${film.title}" không hỗ trợ định dạng ${data.format}. Các định dạng khả dụng: ${film.availableFormats.join(", ")}`,
      };
    }

    const targetRoomId = data.roomId || current.roomId;
    const room = await Room.findOne({ _id: targetRoomId, deleted: false });
    if (!room) throw { status: 404, message: "Không tìm thấy phòng chiếu" };

    if (!room.supportedFormats.includes(data.format)) {
      throw {
        status: 400,
        message: `Phòng ${room.name} không hỗ trợ định dạng ${data.format}. Các định dạng khả dụng: ${room.supportedFormats.join(", ")}`,
      };
    }
  }

  // Validate xung đột thời gian
  if (data.startTime || data.endTime) {
    const checkStart = data.startTime || current.startTime;
    const checkEnd = data.endTime || current.endTime;
    const checkRoom = data.roomId || current.roomId;

    const hasConflict = await checkTimeConflict(checkRoom.toString(), checkStart, checkEnd, id);
    if (hasConflict) throw { status: 400, message: "Khoảng thời gian này bị trùng với suất chiếu khác trong cùng phòng" };
  }

  // Validate filmId mới
  if (data.filmId && data.filmId.toString() !== current.filmId.toString()) {
    const newFilm = await Film.findOne({ _id: data.filmId, deleted: false });
    if (!newFilm) throw { status: 404, message: "Không tìm thấy phim mới" };

    const targetFormat = data.format || current.format;
    if (!newFilm.availableFormats.includes(targetFormat)) {
      throw {
        status: 400,
        message: `Phim "${newFilm.title}" không hỗ trợ định dạng ${targetFormat}. Các định dạng khả dụng: ${newFilm.availableFormats.join(", ")}`,
      };
    }
  }

  // Resnap seats nếu cần
  if (needResnapSeat && data.roomId) {
    const newRoom = await Room.findById(data.roomId);
    if (newRoom) (data as any).seats = snapshotSeats(newRoom.seatLayout);
  }

  return ShowTime.findByIdAndUpdate(id, data, { new: true })
    .populate({ path: "filmId", select: "title thumbnail duration" })
    .populate({ path: "cinemaId", select: "name address" })
    .populate({ path: "roomId", select: "name supportedFormats" });
};

export const deleteShowTime = async (id: string) => {
  const showtime = await ShowTime.findById(id);
  if (!showtime) throw { status: 404, message: "Không tìm thấy suất chiếu" };

  if (hasBookedSeats(showtime.seats)) {
    throw { status: 400, message: "Không thể xóa suất chiếu đã có người đặt vé" };
  }

  showtime.deleted = true;
  await showtime.save();
};

export interface IGetShowTimesByFilmQuery {
  cinemaId?: string;
  cityId?: string;
  format?: string;
  startDate?: string;
  endDate?: string;
}

export const getShowTimesByFilmId = async (filmId: string, isAdmin = false, filters: IGetShowTimesByFilmQuery) => {
  if (!filmId || !/^[0-9a-fA-F]{24}$/.test(filmId)) {
    throw { status: 400, message: "ID phim không hợp lệ" };
  }

  const film = await Film.findOne({
    _id: filmId,
    deleted: false,
    ...(isAdmin ? {} : { status: CommonStatus.ACTIVE }),
  });
  if (!film) throw { status: 404, message: "Không tìm thấy phim" };

  const query: any = { filmId, deleted: false };
  if (!isAdmin) {
    query.status = CommonStatus.ACTIVE;
    query.startTime = { $gte: new Date() };
  }

  if (filters.cinemaId) query.cinemaId = filters.cinemaId;
  if (filters.format) query.format = filters.format;

  if (filters.startDate || filters.endDate) {
    query.startTime = query.startTime || {};
    if (filters.startDate) {
      const d = new Date(filters.startDate);
      d.setHours(0, 0, 0, 0);
      query.startTime.$gte = d;
    }
    if (filters.endDate) {
      const d = new Date(filters.endDate);
      d.setHours(23, 59, 59, 999);
      query.startTime.$lte = d;
    }
  }

  let showtimes: any[] = await ShowTime.find(query)
    .populate({ path: "filmId", select: "title thumbnail duration ageRating" })
    .populate({
      path: "cinemaId",
      select: "name address avatar cityIds parentId",
      populate: [
        { path: "cityIds", select: "name" },
        { path: "parentId", select: "name avatar" },
      ],
    })
    .populate({ path: "roomId", select: "name supportedFormats" })
    .sort({ startTime: 1 });

  // Filter theo cityId trong memory
  if (filters.cityId) {
    showtimes = showtimes.filter((st) =>
      st.cinemaId?.cityIds?.some((city: any) => city._id.toString() === filters.cityId)
    );
  }

  // Group by date → cinema
  const grouped = showtimes.reduce((acc: any, st: any) => {
    const d = new Date(st.startTime);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const cinemaId = st.cinemaId?._id.toString();

    if (!acc[dateKey]) acc[dateKey] = {};
    if (!acc[dateKey][cinemaId]) {
      acc[dateKey][cinemaId] = {
        cinema: {
          _id: st.cinemaId?._id,
          name: st.cinemaId?.name,
          address: st.cinemaId?.address,
          avatar: st.cinemaId?.avatar,
          cities: st.cinemaId?.cityIds,
          brandName: st.cinemaId?.parentId?.name || null,
        },
        showtimes: [],
      };
    }

    acc[dateKey][cinemaId].showtimes.push({
      _id: st._id,
      startTime: st.startTime,
      endTime: st.endTime,
      format: st.format,
      basePrice: st.basePrice,
      seatTypes: st.seatTypes,
      status: st.status,
      room: st.roomId,
      availableSeats: st.seats.filter((s: any) => s.status === "available").length,
      totalSeats: st.seats.length,
    });

    return acc;
  }, {});

  const formattedData = Object.keys(grouped)
    .sort()
    .map((date) => ({ date, cinemas: Object.values(grouped[date]) }));

  return {
    film: { _id: film._id, title: film.title, thumbnail: film.thumbnail, duration: film.duration, ageRating: film.ageRating },
    showtimes: formattedData,
    total: showtimes.length,
  };
};

export const getShowTimesByCinemaId = async (cinemaId: string, dateQuery?: string) => {
  if (!mongoose.Types.ObjectId.isValid(cinemaId)) {
    throw { status: 400, message: "ID rạp chiếu không hợp lệ" };
  }

  const targetDate = new Date(dateQuery || new Date().toISOString().split("T")[0]);
  if (isNaN(targetDate.getTime())) throw { status: 400, message: "Ngày không hợp lệ" };

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const showtimes = await ShowTime.find({
    cinemaId,
    deleted: false,
    status: CommonStatus.ACTIVE,
    startTime: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate({
      path: "filmId",
      select: "title thumbnail duration categoryIds ageRating slug",
      populate: { path: "categoryIds", select: "title" },
    })
    .sort({ startTime: 1 });

  // Group by film
  const groupedByFilm = showtimes.reduce((acc, st: any) => {
    const film = st.filmId;
    if (!film) return acc;

    const filmId = film._id.toString();
    if (!acc[filmId]) {
      acc[filmId] = {
        _id: film._id,
        title: film.title,
        thumbnail: film.thumbnail,
        duration: film.duration,
        ageRating: film.ageRating,
        categoryIds: film.categoryIds,
        slug: film.slug,
        showtimes: [],
      };
    }

    acc[filmId].showtimes.push({
      _id: st._id,
      startTime: st.startTime,
      endTime: st.endTime,
      format: st.format,
      basePrice: st.basePrice,
    });

    return acc;
  }, {} as any);

  return { films: Object.values(groupedByFilm) };
};