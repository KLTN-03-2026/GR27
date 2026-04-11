import { IRoomCreate, IRoomUpdate } from "../../../types/room.type";
import { Request, Response } from "express";
import Room from "../models/room.model";
import ShowTime from "../models/showTime.model";
import { UserRole } from "../../../types/user.type";
import { CommonStatus } from "../../../types/common.type";

//[GET] LIST ROOM: /api/v1/rooms
export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    // Kiểm tra quyền user
    const isAdmin = req.user && req.user.role === UserRole.ADMIN;

    let query: any = { deleted: false };

    // Nếu không phải admin, chỉ hiển thị phòng active và chưa bị xóa
    if (!isAdmin) {
      query = {
        status: CommonStatus.ACTIVE,
        deleted: false,
      };
    }

    const rooms = await Room.find(query).populate({
      path: "cinemaId",
      select: "name address cityIds",
      populate: {
        path: "cityIds",
        select: "name",
      },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: rooms,
    });
  } catch (error) {
    res.status(500).json({ message: "Get rooms failed", error });
    return;
  }
};

//[GET] DETAIL BY ID (ADMIN): /api/v1/rooms/:id
// Trả về room cho admin (chỉ cần chưa bị xóa)
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    const room = await Room.findOne({
      _id: id,
      deleted: false,
    }).populate({
      path: "cinemaId",
      select: "name address cityIds",
      populate: {
        path: "cityIds",
        select: "name",
      },
    });

    if (!room) {  
      res.status(404).json({
        message: "Không tìm thấy phòng chiếu",
      });
      return;
    }
    
    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: room,
    });
  } catch (error) {
    res.status(500).json({ message: "Get room failed", error });
    return;
  }
};

//[POST] CREATE ROOM: /api/v1/rooms
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const createData = req.body as IRoomCreate;
    
    // Kiểm tra xem tên phòng đã tồn tại trong cùng rạp hay chưa
    const existingRoom = await Room.findOne({
      cinemaId: createData.cinemaId,
      name: createData.name,
      deleted: false,
    });

    if (existingRoom) {
      res.status(400).json({
        code: 400,
        message: "Tên phòng đã tồn tại trong rạp này",
      });
      return;
    }

    const room = await Room.create(createData);
    res.status(200).json({
      code: 200,
      message: "Tạo phòng chiếu thành công",
      data: room,
    });
  } catch (error) {
    res.status(500).json({ message: "Create room failed", error });
    return;
  }
};

//[PATCH] EDIT ROOM: /api/v1/rooms/:id
export const edit = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const updateData = req.body as IRoomUpdate;

    // ✅ KIỂM TRA: Nếu đổi cinemaId, phải đảm bảo không có showtime nào
    if (updateData.cinemaId) {
      const currentRoom = await Room.findById(id);
      if (!currentRoom) {
        res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
        return;
      }

      // Chỉ kiểm tra nếu cinemaId thực sự thay đổi
      if (updateData.cinemaId.toString() !== currentRoom.cinemaId.toString()) {
        const hasUpcomingShowtimes = await ShowTime.exists({
          roomId: id,
          deleted: false,
          startTime: { $gte: new Date() }, // Còn suất chiếu tương lai
        });

        if (hasUpcomingShowtimes) {
          res.status(400).json({
            code: 400,
            message: "Không thể chuyển phòng sang rạp khác khi còn suất chiếu sắp tới",
          });
          return;
        }
      }
    }

    // Nếu cập nhật tên phòng hoặc cinemaId, kiểm tra trùng lặp
    if (updateData.name || updateData.cinemaId) {
      const currentRoom = await Room.findById(id);
      if (!currentRoom) {
        res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
        return;
      }

      const checkCinemaId = updateData.cinemaId || currentRoom.cinemaId;
      const checkName = updateData.name || currentRoom.name;

      const existingRoom = await Room.findOne({
        _id: { $ne: id },
        cinemaId: checkCinemaId,
        name: checkName,
        deleted: false,
      });

      if (existingRoom) {
        res.status(400).json({
          code: 400,
          message: "Tên phòng đã tồn tại trong rạp này",
        });
        return;
      }
    }

    const room = await Room.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!room) {
      res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
      return;
    }

    res.status(200).json({
      code: 200,
      message: "Cập nhật phòng chiếu thành công",
      data: room,
    });
  } catch (error) {
    res.status(500).json({ message: "Update room failed", error });
    return;
  }
};

//[DELETE] DELETE ROOM: /api/v1/rooms/:id
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    // ✅ KIỂM TRA: Không cho xóa phòng nếu còn suất chiếu tương lai
    const hasUpcomingShowtimes = await ShowTime.exists({
      roomId: id,
      deleted: false,
      startTime: { $gte: new Date() },
    });

    if (hasUpcomingShowtimes) {
      res.status(400).json({
        code: 400,
        message: "Không thể xóa phòng khi còn suất chiếu sắp tới",
      });
      return;
    }

    const room = await Room.findById(id);

    if (!room) {
      res.status(404).json({ message: "Không tìm thấy phòng chiếu" });
      return;
    }

    room.deleted = true;
    await room.save();

    res.status(200).json({
      code: 200,
      message: "Xóa phòng chiếu thành công",
    });
  } catch (error) {
    res.status(500).json({ message: "Delete room failed", error });
    return;
  }
};