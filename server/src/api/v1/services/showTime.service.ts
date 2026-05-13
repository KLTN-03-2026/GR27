import mongoose from "mongoose";
import ShowTime from "../models/showTime.model";
import Room from "../models/room.model";
import Film from "../models/film.model";
import Cinema from "../models/cinema.model";
import { IShowTimeCreate, IShowTimeUpdate, ShowTimeSeatStatus } from "../../../types/showTime.type";
import { CommonStatus } from "../../../types/common.type";
import Order from "../models/order.model";

// ── Hằng số ───────────────────────────────────────────────────────────────────
const BUFFER_MINUTES = 30; // Giãn cách tối thiểu giữa các suất chiếu (phút)

// ── Helpers nội bộ ────────────────────────────────────────────────────────────

/**
 * Kiểm tra xung đột thời gian (trùng lịch) trong cùng phòng.
 * Trả về true nếu có xung đột.
 */
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

/**
 * Kiểm tra vi phạm giãn cách 30 phút giữa các suất chiếu trong cùng phòng.
 * - Suất chiếu mới phải bắt đầu ít nhất 30 phút sau khi suất trước kết thúc.
 * - Suất chiếu kế tiếp phải bắt đầu ít nhất 30 phút sau khi suất mới kết thúc.
 * Trả về message lỗi nếu vi phạm, null nếu hợp lệ.
 */
const checkBufferConflict = async (
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string
): Promise<string | null> => {
  const bufferMs = BUFFER_MINUTES * 60 * 1000;

  // Khoảng mở rộng bao gồm cả buffer
  const windowStart = new Date(startTime.getTime() - bufferMs);
  const windowEnd = new Date(endTime.getTime() + bufferMs);

  const query: any = {
    roomId,
    deleted: false,
    $or: [
      { startTime: { $lt: windowEnd }, endTime: { $gt: windowStart } },
    ],
  };
  if (excludeId) query._id = { $ne: excludeId };

  const neighbors = await ShowTime.find(query).sort({ startTime: 1 });

  for (const neighbor of neighbors) {
    const nStart = neighbor.startTime.getTime();
    const nEnd = neighbor.endTime.getTime();
    const newStart = startTime.getTime();
    const newEnd = endTime.getTime();

    // Suất chiếu neighbor kết thúc trước suất mới bắt đầu
    if (nEnd <= newStart) {
      const gap = (newStart - nEnd) / 60000;
      if (gap < BUFFER_MINUTES) {
        return `Suất chiếu trước kết thúc lúc ${formatTime(neighbor.endTime)}, cần giãn cách ít nhất ${BUFFER_MINUTES} phút (bắt đầu sớm nhất: ${formatTimeOffset(neighbor.endTime, BUFFER_MINUTES)})`;
      }
    }

    // Suất chiếu neighbor bắt đầu sau suất mới kết thúc
    if (nStart >= newEnd) {
      const gap = (nStart - newEnd) / 60000;
      if (gap < BUFFER_MINUTES) {
        return `Suất chiếu tiếp theo bắt đầu lúc ${formatTime(neighbor.startTime)}, cần giãn cách ít nhất ${BUFFER_MINUTES} phút (kết thúc muộn nhất: ${formatTimeOffset(neighbor.startTime, -BUFFER_MINUTES)})`;
      }
    }
  }

  return null;
};

/**
 * Kiểm tra suất chiếu không được trước ngày khởi chiếu của phim.
 * Trả về message lỗi nếu vi phạm, null nếu hợp lệ.
 */
const checkReleaseDate = (film: any, startTime: Date): string | null => {
  if (!film.releaseDate) return null;
  const release = new Date(film.releaseDate);
  release.setHours(0, 0, 0, 0);
  if (startTime < release) {
    return `Không thể tạo suất chiếu trước ngày khởi chiếu của phim (${release.toLocaleDateString("vi-VN")})`;
  }
  return null;
};

/** Format Date thành "HH:mm DD/MM/YYYY" */
const formatTime = (date: Date): string => {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${hh}:${mm} ${dd}/${mo}/${d.getFullYear()}`;
};

/** Format thời gian dịch chuyển offsetMinutes phút */
const formatTimeOffset = (date: Date, offsetMinutes: number): string => {
  return formatTime(new Date(new Date(date).getTime() + offsetMinutes * 60000));
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
      .sort({ startTime: -1 })
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

  // 7. Validate ngày khởi chiếu
  const releaseDateError = checkReleaseDate(film, new Date(data.startTime));
  if (releaseDateError) throw { status: 400, message: releaseDateError };

  // 8. Kiểm tra xung đột thời gian (trùng lịch)
  const hasConflict = await checkTimeConflict(
  data.roomId.toString(),
  new Date(data.startTime),  // ← thêm new Date()
  new Date(data.endTime)     // ← thêm new Date()
  );
  if (hasConflict) throw { status: 400, message: "Khoảng thời gian này bị trùng với suất chiếu khác trong cùng phòng" };

  // 9. Kiểm tra giãn cách 30 phút
  const bufferError = await checkBufferConflict(
  data.roomId.toString(),
  new Date(data.startTime),  // ← thêm new Date()
  new Date(data.endTime)     // ← thêm new Date()
);
  if (bufferError) throw { status: 400, message: bufferError };

  // 10. Snapshot seats từ room
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

  // Validate ngày khởi chiếu khi đổi phim hoặc đổi startTime
  if (data.filmId || data.startTime) {
    const targetFilmId = data.filmId || current.filmId;
    const film = await Film.findOne({ _id: targetFilmId, deleted: false });
    if (!film) throw { status: 404, message: "Không tìm thấy phim" };

    const checkStart = new Date(data.startTime || current.startTime);
    const releaseDateError = checkReleaseDate(film, checkStart);
    if (releaseDateError) throw { status: 400, message: releaseDateError };
  }

  // Validate xung đột thời gian + giãn cách khi đổi thời gian
  if (data.startTime || data.endTime) {
    const checkStart = new Date(data.startTime || current.startTime);
    const checkEnd = new Date(data.endTime || current.endTime);
    const checkRoom = data.roomId || current.roomId;

    const hasConflict = await checkTimeConflict(checkRoom.toString(), checkStart, checkEnd, id);
    if (hasConflict) throw { status: 400, message: "Khoảng thời gian này bị trùng với suất chiếu khác trong cùng phòng" };

    const bufferError = await checkBufferConflict(checkRoom.toString(), checkStart, checkEnd, id);
    if (bufferError) throw { status: 400, message: bufferError };
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

// ── Trash ────────────────────────────────────────────────────────────────────

export const getTrashedShowTimes = async () => {
  return ShowTime.find({ deleted: true })
    .populate({ path: "filmId", select: "title thumbnail" })
    .populate({ path: "cinemaId", select: "name address" })
    .populate({ path: "roomId", select: "name" })
    .sort({ updatedAt: -1 });
};

export const permanentDeleteShowTime = async (id: string) => {
  const showtime = await ShowTime.findOne({ _id: id, deleted: true });
  if (!showtime) throw { status: 404, message: "Không tìm thấy suất chiếu trong thùng rác" };

  const orderCount = await Order.countDocuments({ showtimeId: id });
  if (orderCount > 0) {
    throw {
      status: 400,
      message: `Không thể xóa vĩnh viễn. Suất chiếu đang được tham chiếu bởi ${orderCount} đơn hàng (kể cả đã hủy). Dữ liệu lịch sử giao dịch sẽ bị mất.`,
    };
  }

  await ShowTime.findByIdAndDelete(id);
};

// ── Bulk Create ───────────────────────────────────────────────────────────────

export interface IBulkShowTimeItem {
  filmId: string;
  cinemaId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  format: string;
  basePrice: number;
  seatTypes: { type: string; extraFee: number }[];
  status?: string;
}

export interface IBulkCreateResult {
  created: number;
  skipped: number;
  errors: string[];
}

/**
 * Tạo suất chiếu hàng loạt.
 * - Validate từng item, bỏ qua (skip) item vi phạm trùng lịch hoặc giãn cách.
 * - Trả về { created, skipped, errors }.
 */
export const createBulkShowTimes = async (showtimes: IBulkShowTimeItem[]): Promise<IBulkCreateResult> => {
  if (!Array.isArray(showtimes) || showtimes.length === 0) {
    throw { status: 400, message: "Danh sách suất chiếu trống" };
  }
  if (showtimes.length > 365) {
    throw { status: 400, message: "Không thể tạo quá 365 suất chiếu cùng lúc" };
  }

  // Cache room & film để tránh query lặp lại
  const roomCache = new Map<string, any>();
  const filmCache = new Map<string, any>();
  const cinemaCache = new Map<string, any>();

  const getRoom = async (roomId: string) => {
    if (!roomCache.has(roomId)) {
      const room = await Room.findOne({ _id: roomId, deleted: false });
      roomCache.set(roomId, room);
    }
    return roomCache.get(roomId);
  };

  const getFilm = async (filmId: string) => {
    if (!filmCache.has(filmId)) {
      const film = await Film.findOne({ _id: filmId, deleted: false });
      filmCache.set(filmId, film);
    }
    return filmCache.get(filmId);
  };

  const getCinema = async (cinemaId: string) => {
    if (!cinemaCache.has(cinemaId)) {
      const cinema = await Cinema.findOne({ _id: cinemaId, deleted: false });
      cinemaCache.set(cinemaId, cinema);
    }
    return cinemaCache.get(cinemaId);
  };

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Sắp xếp theo startTime để giảm conflict với nhau
  const sorted = [...showtimes].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  for (const item of sorted) {
    const startTime = new Date(item.startTime);
    const endTime = new Date(item.endTime);
    const dateLabel = `${String(startTime.getDate()).padStart(2, "0")}/${String(startTime.getMonth() + 1).padStart(2, "0")}/${startTime.getFullYear()} ${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`;

    try {
      // Validate entities
      const room = await getRoom(item.roomId);
      if (!room) { skipped++; errors.push(`[${dateLabel}] Không tìm thấy phòng chiếu`); continue; }

      const film = await getFilm(item.filmId);
      if (!film) { skipped++; errors.push(`[${dateLabel}] Không tìm thấy phim`); continue; }

      const cinema = await getCinema(item.cinemaId);
      if (!cinema) { skipped++; errors.push(`[${dateLabel}] Không tìm thấy rạp chiếu`); continue; }

      if (item.cinemaId.toString() !== room.cinemaId.toString()) {
        skipped++; errors.push(`[${dateLabel}] Rạp chiếu không khớp với phòng`); continue;
      }

      if (!film.availableFormats.includes(item.format)) {
        skipped++; errors.push(`[${dateLabel}] Phim không hỗ trợ định dạng ${item.format}`); continue;
      }

      if (!room.supportedFormats.includes(item.format)) {
        skipped++; errors.push(`[${dateLabel}] Phòng không hỗ trợ định dạng ${item.format}`); continue;
      }

      // Validate ngày khởi chiếu
      const releaseDateError = checkReleaseDate(film, startTime);
      if (releaseDateError) {
        skipped++;
        errors.push(`[${dateLabel}] ${releaseDateError}`);
        continue;
      }

      // Kiểm tra xung đột thời gian
      const hasConflict = await checkTimeConflict(item.roomId, startTime, endTime);
      if (hasConflict) {
        skipped++;
        errors.push(`[${dateLabel}] Trùng lịch với suất chiếu khác`);
        continue;
      }

      // Kiểm tra giãn cách 30 phút
      const bufferError = await checkBufferConflict(item.roomId, startTime, endTime);
      if (bufferError) {
        skipped++;
        errors.push(`[${dateLabel}] Vi phạm giãn cách: ${bufferError}`);
        continue;
      }

      // Tạo suất chiếu
      await ShowTime.create({
        filmId: item.filmId,
        cinemaId: item.cinemaId,
        roomId: item.roomId,
        startTime,
        endTime,
        format: item.format,
        basePrice: item.basePrice,
        seatTypes: item.seatTypes,
        status: item.status || CommonStatus.INACTIVE,
        seats: snapshotSeats(room.seatLayout),
      });

      created++;
    } catch (err: any) {
      skipped++;
      errors.push(`[${dateLabel}] Lỗi: ${err?.message || "Lỗi không xác định"}`);
    }
  }

  return { created, skipped, errors };
};

// ── Public queries ────────────────────────────────────────────────────────────

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

  if (filters.cityId) {
    showtimes = showtimes.filter((st) =>
      st.cinemaId?.cityIds?.some((city: any) => city._id.toString() === filters.cityId)
    );
  }

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