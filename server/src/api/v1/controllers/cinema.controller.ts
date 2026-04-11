// src/api/v1/controllers/cinema.controller.ts
import { ICinemaCreate, ICinemaUpdate } from "../../../types/cinema.type";
import { Request, Response } from "express";
import Cinema from "../models/cinema.model";
import ShowTime from "../models/showTime.model";
import { UserRole } from "../../../types/user.type";
import { CommonStatus } from "../../../types/common.type";

//[GET] LIST CINEMA: /api/v1/cinemas
export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    // Kiểm tra quyền user
    const isAdmin = req.user && req.user.role === UserRole.ADMIN;

    let query: any = { deleted: false };

    // Nếu không phải admin, chỉ hiển thị rạp chiếu active và chưa bị xóa
    if (!isAdmin) {
      query = {
        status: CommonStatus.ACTIVE,
        deleted: false,
      };
    }

    const cinemas = await Cinema.find(query).populate({
      path: "parentId",
      select: "name avatar",
    }).populate({
      path: "cityIds",
      select: "name",
    }).sort({ createdAt: -1 });
    res.status(200).json(cinemas);
  } catch (error) {
    res.status(500).json({ message: "Get cinemas failed", error });
    return;
  }
};

//[GET] DETAIL BY SLUG (PUBLIC): /api/v1/cinemas/slug/:slug
// Chỉ trả về cinema có status active và chưa bị xóa
export const getBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug;
    
    const cinema = await Cinema.findOne({
      slug,
      status: CommonStatus.ACTIVE,
      deleted: false,
    })
    .populate({
      path: "cityIds",
      select: "name",
    })
    .populate({
      path: "parentId",
      select: "name",
    });

    if (!cinema) {  
      res.status(404).json({
        message: "Rạp chiếu không tồn tại hoặc chưa được công bố",
      });
      return;
    }
    
    res.status(200).json(cinema);
  } catch (error) {
    res.status(500).json({ message: "Get cinema failed", error });
    return;
  }
};

//[GET] DETAIL BY ID (ADMIN): /api/v1/cinemas/:id
// Trả về cinema cho admin (chỉ cần chưa bị xóa)
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    const cinema = await Cinema.findOne({
      _id: id,
      deleted: false,
    })
    .populate({
      path: "cityIds", 
      select: "name",
    })
    .populate({
      path: "parentId",
      select: "name avatar",
    });

    if (!cinema) {  
      res.status(404).json({
        message: "Không tìm thấy rạp chiếu",
      });
      return;
    }
    
    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: cinema,
    });
  } catch (error) {
    res.status(500).json({ message: "Get cinema failed", error });
    return;
  }
};

//[POST] CREATE CINEMA: /api/v1/cinemas
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const createData = req.body as ICinemaCreate;
    const cinema = await Cinema.create(createData);
    res.status(200).json(cinema);
  } catch (error) {
    res.status(500).json({ message: "Create cinema failed", error });
    return;
  }
};

//[PATCH] EDIT CINEMA: /api/v1/cinemas/:id
export const edit = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const updateData = req.body as ICinemaUpdate;
    const cinema = await Cinema.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!cinema) {
      res.status(404).json({ message: "Không tìm thấy rạp chiếu" });
      return;
    }
    res.status(200).json(cinema);
  } catch (error) {
    res.status(500).json({ message: "Update cinema failed", error });
    return;
  }
};

//[DELETE] DELETE CINEMA: /api/v1/cinemas/:id
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    // ✅ KIỂM TRA: Không cho xóa rạp nếu còn suất chiếu tương lai
    const hasUpcomingShowtimes = await ShowTime.exists({
      cinemaId: id,
      deleted: false,
      startTime: { $gte: new Date() },
    });

    if (hasUpcomingShowtimes) {
      res.status(400).json({
        code: 400,
        message: "Không thể xóa rạp khi còn suất chiếu sắp tới",
      });
      return;
    }

    const cinema = await Cinema.findById(id);
    if (!cinema) {
      res.status(404).json({ message: "Không tìm thấy rạp chiếu" });
      return;
    }

    cinema.deleted = true;
    await cinema.save();
    
    res.status(200).json({ 
      code: 200,
      message: "Xóa rạp chiếu thành công" 
    });
  } catch (error) {
    res.status(500).json({ message: "Delete cinema failed", error });
    return;
  }
};