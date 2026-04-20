import Room from "../models/room.model";
import ShowTime from "../models/showTime.model";
import { IRoomCreate, IRoomUpdate } from "../../../types/room.type";
import { CommonStatus } from "../../../types/common.type";
import { UserRole } from "../../../types/user.type";

// populate dùng chung cho room queries
const CINEMA_POPULATE = {
  path: "cinemaId",
  select: "name address cityIds",
  populate: { path: "cityIds", select: "name" },
};

export const getAllRooms = async (userRole?: string) => {
  const isAdmin = userRole === UserRole.ADMIN;

  const query: any = { deleted: false };
  if (!isAdmin) query.status = CommonStatus.ACTIVE;

  return Room.find(query)
    .populate(CINEMA_POPULATE)
    .sort({ createdAt: -1 });
};

export const getRoomById = async (id: string) => {
  const room = await Room.findOne({ _id: id, deleted: false })
    .populate(CINEMA_POPULATE);

  if (!room) throw { status: 404, message: "Không tìm thấy phòng chiếu" };
  return room;
};

export const createRoom = async (data: IRoomCreate) => {
  const existingRoom = await Room.findOne({
    cinemaId: data.cinemaId,
    name: data.name,
    deleted: false,
  });

  if (existingRoom) throw { status: 400, message: "Tên phòng đã tồn tại trong rạp này" };

  return Room.create(data);
};

export const updateRoom = async (id: string, data: IRoomUpdate) => {
  // Kiểm tra nếu đổi cinemaId
  if (data.cinemaId) {
    const currentRoom = await Room.findById(id);
    if (!currentRoom) throw { status: 404, message: "Không tìm thấy phòng chiếu" };

    const isChangingCinema = data.cinemaId.toString() !== currentRoom.cinemaId.toString();
    if (isChangingCinema) {
      const hasUpcomingShowtimes = await ShowTime.exists({
        roomId: id,
        deleted: false,
        startTime: { $gte: new Date() },
      });

      if (hasUpcomingShowtimes) {
        throw {
          status: 400,
          message: "Không thể chuyển phòng sang rạp khác khi còn suất chiếu sắp tới",
        };
      }
    }
  }

  // Kiểm tra trùng tên nếu đổi name hoặc cinemaId
  if (data.name || data.cinemaId) {
    const currentRoom = await Room.findById(id);
    if (!currentRoom) throw { status: 404, message: "Không tìm thấy phòng chiếu" };

    const checkCinemaId = data.cinemaId || currentRoom.cinemaId;
    const checkName = data.name || currentRoom.name;

    const duplicateRoom = await Room.findOne({
      _id: { $ne: id },
      cinemaId: checkCinemaId,
      name: checkName,
      deleted: false,
    });

    if (duplicateRoom) throw { status: 400, message: "Tên phòng đã tồn tại trong rạp này" };
  }

  const room = await Room.findByIdAndUpdate(id, data, { new: true });
  if (!room) throw { status: 404, message: "Không tìm thấy phòng chiếu" };
  return room;
};

export const deleteRoom = async (id: string) => {
  const hasUpcomingShowtimes = await ShowTime.exists({
    roomId: id,
    deleted: false,
    startTime: { $gte: new Date() },
  });

  if (hasUpcomingShowtimes) {
    throw { status: 400, message: "Không thể xóa phòng khi còn suất chiếu sắp tới" };
  }

  const room = await Room.findById(id);
  if (!room) throw { status: 404, message: "Không tìm thấy phòng chiếu" };

  room.deleted = true;
  await room.save();
};

// ── Trash ────────────────────────────────────────────────────────────────────
 
export const getTrashedRooms = async () => {
  return Room.find({ deleted: true })
    .populate(CINEMA_POPULATE)
    .sort({ updatedAt: -1 });
};
 
// Xóa vĩnh viễn — check kỹ trước khi xóa
export const permanentDeleteRoom = async (id: string) => {
  const room = await Room.findOne({ _id: id, deleted: true });
  if (!room) throw { status: 404, message: "Không tìm thấy phòng chiếu trong thùng rác" };
 
  // Check showtime — kể cả deleted, vì order vẫn tham chiếu showtime đó qua roomId
  const showtimeCount = await ShowTime.countDocuments({ roomId: id });
  if (showtimeCount > 0) {
    throw {
      status: 400,
      message: `Không thể xóa vĩnh viễn. Phòng đang được tham chiếu bởi ${showtimeCount} suất chiếu (kể cả đã xóa). Dữ liệu đơn hàng có thể bị ảnh hưởng.`,
    };
  }
 
  await Room.findByIdAndDelete(id);
};