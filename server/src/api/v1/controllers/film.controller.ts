import { Request, Response } from "express";
import Film from "../models/film.model";
import { IFilmCreate, IFilmUpdate } from "../../../types/film.type";
import { CommonStatus } from "../../../types/common.type";
import { UserRole } from "../../../types/user.type";


// [GET] /api/v1/films - Lấy danh sách film
export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    let query: any = { deleted: false };

    const isAdmin = req.user && req.user.role === UserRole.ADMIN;
    if (!isAdmin) {
      query.status = CommonStatus.ACTIVE;
    }

    const films = await Film.find(query).populate({
      path: "categoryIds",
      select: "title",
    }).sort({ createdAt: -1 })  ;

    if (!films || films.length === 0) {
      res.status(404).json({
        message: isAdmin
          ? "Không tìm thấy film nào"
          : "Không có film nào công khai",
      });
      return;
    }

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: films,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error,
    });
  }
};


// [GET] /api/v1/films/:slug - Xem chi tiết (public)
export const getBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug = "" } = req.params;
    const film = await Film.findOne({
      slug: slug,
      status: CommonStatus.ACTIVE,
      deleted: false,
    }).populate({
      path: "categoryIds",
      select: "title",
    });

    if (!film) {
      res.status(404).json({
        message: "Film không tồn tại hoặc chưa được công bố",
      });
      return;
    }

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: film,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error, // ✅ Trả về message lỗi để debug
    });
  }
};

// [GET] /api/v1/films/:id - Lấy chi tiết để edit (admin only)
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const film = await Film.findOne({
      _id: id,
      deleted: false,
    }).populate({
      path: "categoryIds",
      select: "title",
    });

    if (!film) {
      res.status(404).json({ message: "Không tìm thấy film" });
      return;
    }

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: film,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

//[POST] CREATE: /api/v1/films
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const createData = req.body as IFilmCreate;
    const film = await Film.create(createData);
    res.status(200).json(film); // không cần return
  } catch (error) {
    res.status(500).json({ message: "Create film failed", error });
  }
};

//[PATCH] EDIT: /api/v1/films/:id
export const edit = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const updateData = req.body as IFilmUpdate;
    const film = await Film.findByIdAndUpdate(id, updateData, { new: true });
    if (!film) {
      res.status(404).json({ message: "Không tìm thấy film" });
      return;
    }
    res.status(200).json(film);
  } catch (error) {
    res.status(500).json({ message: "Update film failed", error });
  }
};

//[DELETE] DELETE: /api/v1/films/:id
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const film = await Film.findById(id);
    if (!film) {
      res.status(404).json({ message: "Không tìm thấy film" });
      return;
    }
    film.deleted = true;
    await film.save();
    res.status(200).json({
      message: "Xóa film thành công",
    });
  } catch (error) {
    res.status(500).json({ message: "Delete film failed", error });
  }
};
