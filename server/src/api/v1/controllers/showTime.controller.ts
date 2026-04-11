import { Request, Response } from "express";
import ShowTime from "../models/showTime.model";
import Room from "../models/room.model";
import Film from "../models/film.model";
import Cinema from "../models/cinema.model";
import { IShowTimeCreate, IShowTimeUpdate, ShowTimeSeatStatus } from "../../../types/showTime.type";
import { CommonStatus } from "../../../types/common.type";
import { UserRole } from "../../../types/user.type";
import mongoose from "mongoose";

/**
 * Kiểm tra xung đột thời gian giữa các suất chiếu trong cùng phòng
 */
const checkTimeConflict = async (
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeShowTimeId?: string
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

  if (excludeShowTimeId) {
    query._id = { $ne: excludeShowTimeId };
  }

  const conflictingShowTime = await ShowTime.findOne(query);
  return !!conflictingShowTime;
};

/**
 * Kiểm tra xem suất chiếu có ghế nào đang bị BOOKED hay không
 */
const hasBookedSeats = (seats: any[]): boolean => {
  return seats.some(seat => seat.status === ShowTimeSeatStatus.BOOKED);
};

// [GET] LIST SHOWTIME
export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user && req.user.role === UserRole.ADMIN;

    // Pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    let query: any = { deleted: false };

    // Filter by status
    if (req.query.status) {
      if (Object.values(CommonStatus).includes(req.query.status as CommonStatus)) {
        query.status = req.query.status;
      }
    } else if (!isAdmin) {
      query.status = CommonStatus.ACTIVE;
    }

    // Filter by filmId
    if (req.query.filmId) query.filmId = req.query.filmId;
    
    // Filter by cinemaId
    if (req.query.cinemaId) query.cinemaId = req.query.cinemaId;
    
    // Filter by roomId
    if (req.query.roomId) query.roomId = req.query.roomId;

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.startTime = {};
      if (req.query.startDate) {
        query.startTime.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        query.startTime.$lte = new Date(req.query.endDate as string);
      }
    }

    // Get total count for pagination
    const total = await ShowTime.countDocuments(query);

    // Get paginated data
    const showtimes = await ShowTime.find(query)
      .populate({ path: "filmId", select: "title" })
      .populate({ path: "cinemaId", select: "name address" })
      .populate({ path: "roomId", select: "name" })
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: showtimes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get showtimes error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [GET] DETAIL BY ID
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = req.user && req.user.role === UserRole.ADMIN;

    let query: any = { _id: id, deleted: false };

    if (!isAdmin) {
      query.status = CommonStatus.ACTIVE;
    }

    const showtime = await ShowTime.findOne(query)
      .populate({ path: "filmId", select: "title thumbnail duration description actors directors ageRating" })
      .populate({ path: "cinemaId", select: "name address avatar" })
      .populate({ path: "roomId", select: "name supportedFormats" });

    if (!showtime) {
      res.status(404).json({ message: "Không tìm thấy suất chiếu" });
      return;
    }

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: showtime,
    });
  } catch (error) {
    console.error("Get showtime error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [POST] CREATE SHOWTIME
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const createData = req.body as IShowTimeCreate;

    // 1. Kiểm tra phòng chiếu có tồn tại không
    const room = await Room.findOne({
      _id: createData.roomId,
      deleted: false,
    });

    if (!room) {
      res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
      return;
    }

    // 2. Kiểm tra cinemaId phải khớp với cinema của room
    if (createData.cinemaId.toString() !== room.cinemaId.toString()) {
      res.status(400).json({
        code: 400,
        message: "Rạp chiếu không khớp với rạp chứa phòng này",
      });
      return;
    }

    // 3. Kiểm tra phim có tồn tại không
    const film = await Film.findOne({
      _id: createData.filmId,
      deleted: false,
    });

    if (!film) {
      res.status(404).json({ message: "Không tìm thấy phim" });
      return;
    }

    // 4. Kiểm tra rạp có tồn tại không
    const cinema = await Cinema.findOne({
      _id: createData.cinemaId,
      deleted: false,
    });

    if (!cinema) {
      res.status(404).json({ message: "Không tìm thấy rạp chiếu" });
      return;
    }

    // 5. Kiểm tra format có được hỗ trợ bởi PHIM không
    if (!film.availableFormats.includes(createData.format)) {
      res.status(400).json({
        code: 400,
        message: `Phim "${film.title}" không hỗ trợ định dạng ${createData.format}. Các định dạng khả dụng: ${film.availableFormats.join(", ")}`,
      });
      return;
    }

    // 6. Kiểm tra format có được hỗ trợ bởi PHÒNG không
    if (!room.supportedFormats.includes(createData.format)) {
      res.status(400).json({
        code: 400,
        message: `Phòng ${room.name} không hỗ trợ định dạng ${createData.format}. Các định dạng khả dụng: ${room.supportedFormats.join(", ")}`,
      });
      return;
    }

    // 7. Kiểm tra xung đột thời gian
    const hasConflict = await checkTimeConflict(
      createData.roomId.toString(),
      createData.startTime,
      createData.endTime
    );

    if (hasConflict) {
      res.status(400).json({
        message: "Khoảng thời gian này bị trùng với suất chiếu khác trong cùng phòng",
      });
      return;
    }

    // 8. Snapshot seatLayout từ room và thêm status
    const seats = room.seatLayout.map((seat) => ({
      row: seat.row,
      number: seat.number,
      type: seat.type,
      seatKey: seat.seatKey,
      partnerSeatKey: seat.partnerSeatKey,
      status: ShowTimeSeatStatus.AVAILABLE,
    }));

    // 9. Tạo showtime với seats đã snapshot
    const showtime = await ShowTime.create({
      ...createData,
      seats,
    });

    res.status(201).json({
      code: 201,
      message: "Tạo suất chiếu thành công",
      data: showtime,
    });
  } catch (error) {
    console.error("Create showtime error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [PATCH] EDIT SHOWTIME
export const edit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body as IShowTimeUpdate;

    // 1. Lấy showtime hiện tại
    const currentShowtime = await ShowTime.findOne({
      _id: id,
      deleted: false,
    });

    if (!currentShowtime) {
      res.status(404).json({ message: "Không tìm thấy suất chiếu" });
      return;
    }

    // 2. Kiểm tra có ghế nào đã booked hay không
    if (hasBookedSeats(currentShowtime.seats)) {
      res.status(400).json({
        code: 400,
        message: "Không thể sửa suất chiếu đã có người đặt vé",
      });
      return;
    }

    // 3. Kiểm tra các trường liên quan đến room và cinema
    let needResnapSeat = false;

    // Nếu đổi roomId
    if (updateData.roomId && updateData.roomId.toString() !== currentShowtime.roomId.toString()) {
      needResnapSeat = true;
      
      const newRoom = await Room.findOne({
        _id: updateData.roomId,
        deleted: false,
      });

      if (!newRoom) {
        res.status(404).json({ message: "Không tìm thấy phòng chiếu mới" });
        return;
      }

      // Kiểm tra cinemaId mới (nếu có) phải khớp với room mới
      const targetCinemaId = updateData.cinemaId || currentShowtime.cinemaId;
      if (targetCinemaId.toString() !== newRoom.cinemaId.toString()) {
        res.status(400).json({
          code: 400,
          message: "Rạp chiếu không khớp với rạp chứa phòng mới",
        });
        return;
      }

      // Kiểm tra format có được hỗ trợ bởi phòng mới không
      const targetFormat = updateData.format || currentShowtime.format;
      if (!newRoom.supportedFormats.includes(targetFormat)) {
        res.status(400).json({
          code: 400,
          message: `Phòng ${newRoom.name} không hỗ trợ định dạng ${targetFormat}. Các định dạng khả dụng: ${newRoom.supportedFormats.join(", ")}`,
        });
        return;
      }
    }

    // Nếu đổi cinemaId (không đổi roomId)
    if (updateData.cinemaId && !updateData.roomId) {
      const currentRoom = await Room.findById(currentShowtime.roomId);
      if (currentRoom && updateData.cinemaId.toString() !== currentRoom.cinemaId.toString()) {
        res.status(400).json({
          code: 400,
          message: "Không thể đổi rạp mà không đổi phòng. Phòng hiện tại thuộc rạp khác.",
        });
        return;
      }
    }

    // 4. Nếu update format, kiểm tra format có được hỗ trợ không
    if (updateData.format) {
      const targetFilmId = updateData.filmId || currentShowtime.filmId;
      const film = await Film.findOne({
        _id: targetFilmId,
        deleted: false,
      });

      if (!film) {
        res.status(404).json({ message: "Không tìm thấy phim" });
        return;
      }

      if (!film.availableFormats.includes(updateData.format)) {
        res.status(400).json({
          code: 400,
          message: `Phim "${film.title}" không hỗ trợ định dạng ${updateData.format}. Các định dạng khả dụng: ${film.availableFormats.join(", ")}`,
        });
        return;
      }

      const targetRoomId = updateData.roomId || currentShowtime.roomId;
      const room = await Room.findOne({
        _id: targetRoomId,
        deleted: false,
      });

      if (!room) {
        res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
        return;
      }

      if (!room.supportedFormats.includes(updateData.format)) {
        res.status(400).json({
          code: 400,
          message: `Phòng ${room.name} không hỗ trợ định dạng ${updateData.format}. Các định dạng khả dụng: ${room.supportedFormats.join(", ")}`,
        });
        return;
      }
    }

    // 5. Nếu update thời gian, kiểm tra xung đột
    if (updateData.startTime || updateData.endTime) {
      const checkStartTime = updateData.startTime || currentShowtime.startTime;
      const checkEndTime = updateData.endTime || currentShowtime.endTime;
      const checkRoomId = updateData.roomId || currentShowtime.roomId;

      const hasConflict = await checkTimeConflict(
        checkRoomId.toString(),
        checkStartTime,
        checkEndTime,
        id
      );

      if (hasConflict) {
        res.status(400).json({
          message: "Khoảng thời gian này bị trùng với suất chiếu khác trong cùng phòng",
        });
        return;
      }
    }

    // 6. Nếu update filmId, kiểm tra phim mới
    if (updateData.filmId && updateData.filmId.toString() !== currentShowtime.filmId.toString()) {
      const newFilm = await Film.findOne({
        _id: updateData.filmId,
        deleted: false,
      });

      if (!newFilm) {
        res.status(404).json({ message: "Không tìm thấy phim mới" });
        return;
      }

      const targetFormat = updateData.format || currentShowtime.format;
      if (!newFilm.availableFormats.includes(targetFormat)) {
        res.status(400).json({
          code: 400,
          message: `Phim "${newFilm.title}" không hỗ trợ định dạng ${targetFormat}. Các định dạng khả dụng: ${newFilm.availableFormats.join(", ")}`,
        });
        return;
      }
    }

    // 7. Xử lý resnap seats nếu cần
    if (needResnapSeat && updateData.roomId) {
      const newRoom = await Room.findById(updateData.roomId);
      if (newRoom) {
        const newSeats = newRoom.seatLayout.map((seat) => ({
          row: seat.row,
          number: seat.number,
          type: seat.type,
          seatKey: seat.seatKey,
          partnerSeatKey: seat.partnerSeatKey,
          status: ShowTimeSeatStatus.AVAILABLE,
        }));
        
        (updateData as any).seats = newSeats;
      }
    }

    // 8. Update showtime
    const updatedShowtime = await ShowTime.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    )
      .populate({ path: "filmId", select: "title thumbnail duration" })
      .populate({ path: "cinemaId", select: "name address" })
      .populate({ path: "roomId", select: "name supportedFormats" });

    res.status(200).json({
      code: 200,
      message: "Cập nhật suất chiếu thành công",
      data: updatedShowtime,
    });
  } catch (error) {
    console.error("Update showtime error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [DELETE] DELETE SHOWTIME
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const showtime = await ShowTime.findById(id);

    if (!showtime) {
      res.status(404).json({ message: "Không tìm thấy suất chiếu" });
      return;
    }

    // Kiểm tra xem có ghế nào đã được đặt chưa
    if (hasBookedSeats(showtime.seats)) {
      res.status(400).json({
        code: 400,
        message: "Không thể xóa suất chiếu đã có người đặt vé",
      });
      return;
    }

    showtime.deleted = true;
    await showtime.save();

    res.status(200).json({
      code: 200,
      message: "Xóa suất chiếu thành công",
    });
  } catch (error) {
    console.error("Delete showtime error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [GET] SHOWTIMES BY FILM ID: /api/v1/show-times/film/:filmId
export const getByFilmId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filmId } = req.params;
    const isAdmin = req.user && req.user.role === UserRole.ADMIN;

    // Validate filmId
    if (!filmId || !/^[0-9a-fA-F]{24}$/.test(filmId)) {
      res.status(400).json({
        code: 400,
        message: "ID phim không hợp lệ",
      });
      return;
    }

    // Kiểm tra phim có tồn tại không
    const film = await Film.findOne({
      _id: filmId,
      deleted: false,
      ...(isAdmin ? {} : { status: CommonStatus.ACTIVE }),
    });

    if (!film) {
      res.status(404).json({
        code: 404,
        message: "Không tìm thấy phim",
      });
      return;
    }

    // Build query
    let query: any = {
      filmId: filmId,
      deleted: false,
    };

    // Nếu không phải admin, chỉ lấy suất chiếu active và từ thời điểm hiện tại trở đi
    if (!isAdmin) {
      query.status = CommonStatus.ACTIVE;
      query.startTime = { $gte: new Date() };
    }

    // Filter by cinemaId nếu có
    if (req.query.cinemaId) {
      query.cinemaId = req.query.cinemaId;
    }

    // Filter by cityId nếu có
    let cityFilter: any = null;
    if (req.query.cityId) {
      cityFilter = req.query.cityId;
    }

    // Filter by format nếu có
    if (req.query.format) {
      query.format = req.query.format;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.startTime = query.startTime || {};
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate as string);
        startDate.setHours(0, 0, 0, 0);
        query.startTime.$gte = startDate;
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate as string);
        endDate.setHours(23, 59, 59, 999);
        query.startTime.$lte = endDate;
      }
    }

    // Lấy tất cả suất chiếu (không pagination)
    let showtimes = await ShowTime.find(query)
      .populate({
        path: "filmId",
        select: "title thumbnail duration ageRating",
      })
      .populate({
        path: "cinemaId",
        select: "name address avatar cityIds parentId",
        populate: [
          {
            path: "cityIds",
            select: "name",
          },
          {
            path: "parentId",
            select: "name avatar",
          }
        ],
      })
      .populate({
        path: "roomId",
        select: "name supportedFormats",
      })
      .sort({ startTime: 1 });

    // Filter theo cityId nếu có (trong memory)
    if (cityFilter) {
      showtimes = showtimes.filter((showtime: any) => {
        return showtime.cinemaId?.cityIds?.some(
          (city: any) => city._id.toString() === cityFilter
        );
      });
    }

    // Group by date và cinema
    const groupedShowtimes = showtimes.reduce((acc: any, showtime: any) => {
      const showtimeDate = new Date(showtime.startTime);
      const dateKey = `${showtimeDate.getFullYear()}-${String(showtimeDate.getMonth() + 1).padStart(2, '0')}-${String(showtimeDate.getDate()).padStart(2, '0')}`;
      const cinemaId = showtime.cinemaId?._id.toString();

      if (!acc[dateKey]) {
        acc[dateKey] = {};
      }

      if (!acc[dateKey][cinemaId]) {
        acc[dateKey][cinemaId] = {
          cinema: {
            _id: showtime.cinemaId?._id,
            name: showtime.cinemaId?.name,
            address: showtime.cinemaId?.address,
            avatar: showtime.cinemaId?.avatar,
            cities: showtime.cinemaId?.cityIds,
            brandName: showtime.cinemaId?.parentId?.name || null,
          },
          showtimes: [],
        };
      }

      acc[dateKey][cinemaId].showtimes.push({
        _id: showtime._id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        format: showtime.format,
        basePrice: showtime.basePrice,
        seatTypes: showtime.seatTypes,
        status: showtime.status,
        room: showtime.roomId,
        availableSeats: showtime.seats.filter(
          (seat: any) => seat.status === "available"
        ).length,
        totalSeats: showtime.seats.length,
      });

      return acc;
    }, {});

    // Convert grouped object to array và sort theo ngày
    const formattedData = Object.keys(groupedShowtimes)
      .sort()
      .map((date) => ({
        date,
        cinemas: Object.values(groupedShowtimes[date]),
      }));

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: {
        film: {
          _id: film._id,
          title: film.title,
          thumbnail: film.thumbnail,
          duration: film.duration,
          ageRating: film.ageRating,
        },
        showtimes: formattedData,
        total: showtimes.length,
      },
    });
  } catch (error) {
    console.error("Get showtimes by film error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};



// [GET] SHOWTIMES BY CINEMA ID: /api/v1/show-times/cinema/:cinemaId
export const getByCinemaId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cinemaId } = req.params;
    const dateQuery = req.query.date as string || new Date().toISOString().split('T')[0];

    if (!mongoose.Types.ObjectId.isValid(cinemaId)) {
      res.status(400).json({ code: 400, message: "ID rạp chiếu không hợp lệ" });
      return;
    }

    const targetDate = new Date(dateQuery);
    if (isNaN(targetDate.getTime())) {
      res.status(400).json({ code: 400, message: "Ngày không hợp lệ" });
      return;
    }

    // 2. Thiết lập khoảng thời gian truy vấn trong ngày
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // <<<<<<<<<<<<<<< THAY ĐỔI LOGIC TẠI ĐÂY >>>>>>>>>>>>>>>
    // Bỏ đi logic so sánh với "now" để lấy tất cả suất chiếu trong ngày.
    // const now = new Date();
    // const queryStartTime = startOfDay > now ? startOfDay : now;
    // <<<<<<<<<<<<<<<<<<<<<<<  HẾT  >>>>>>>>>>>>>>>>>>>>>>>>>

    // 3. Truy vấn suất chiếu
    const showtimes = await ShowTime.find({
      cinemaId,
      deleted: false,
      status: CommonStatus.ACTIVE,
      // MODIFIED: Luôn lấy từ đầu ngày (startOfDay)
      startTime: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate({
        path: "filmId",
        select: "title thumbnail duration categoryIds ageRating slug", // ADDED: Thêm 'slug'
        populate: {
          path: "categoryIds",
          select: "title"
        }
      })
      .sort({ startTime: 1 });

    // 4. Nhóm các suất chiếu theo filmId
    const groupedByFilm = showtimes.reduce((acc, showtime: any) => {
      const film = showtime.filmId;
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
          slug: film.slug, // ADDED: Thêm 'slug'
          showtimes: [],
        };
      }

      acc[filmId].showtimes.push({
        _id: showtime._id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        format: showtime.format,
        basePrice: showtime.basePrice
      });

      return acc;
    }, {} as any);
    
    const films = Object.values(groupedByFilm);

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: {
        films: films,
      },
    });

  } catch (error) {
    console.error("Get showtimes by cinema error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};