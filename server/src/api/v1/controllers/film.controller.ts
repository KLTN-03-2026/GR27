import { Request, Response } from "express";
import * as filmService from "../services/film.service";
import { IFilmCreate, IFilmUpdate } from "../../../types/film.type";

// [GET] /api/v1/films
export const index = async (req: Request, res: Response): Promise<void> => {
  const films = await filmService.getAllFilms(req.user?.role);
  res.status(200).json({ code: 200, message: "Thành công", data: films });
};

// [GET] /api/v1/films/slug/:slug  (public)
export const getBySlug = async (req: Request, res: Response): Promise<void> => {
  const film = await filmService.getFilmBySlug(req.params.slug);
  res.status(200).json({ code: 200, message: "Thành công", data: film });
};

// [GET] /api/v1/films/trash  (admin)
export const getTrash = async (req: Request, res: Response): Promise<void> => {
  const films = await filmService.getTrashedFilms();
  res.status(200).json({ code: 200, message: "Thành công", data: films });
};

// [GET] /api/v1/films/:id  (admin)
export const getById = async (req: Request, res: Response): Promise<void> => {
  const film = await filmService.getFilmById(req.params.id);
  res.status(200).json({ code: 200, message: "Thành công", data: film });
};

// [POST] /api/v1/films
export const create = async (req: Request, res: Response): Promise<void> => {
  const film = await filmService.createFilm(req.body as IFilmCreate);
  res.status(201).json({ code: 201, message: "Tạo film thành công", data: film });
};

// [PATCH] /api/v1/films/:id 
export const edit = async (req: Request, res: Response): Promise<void> => {
  const film = await filmService.updateFilm(req.params.id, req.body as IFilmUpdate);
  res.status(200).json({ code: 200, message: "Cập nhật film thành công", data: film });
};

// [DELETE] /api/v1/films/:id  — xóa mềm
export const remove = async (req: Request, res: Response): Promise<void> => {
  await filmService.deleteFilm(req.params.id);
  res.status(200).json({ code: 200, message: "Xóa film thành công" });
};

// [DELETE] /api/v1/films/:id/permanent  — xóa vĩnh viễn (chỉ film trong trash)
export const permanentDelete = async (req: Request, res: Response): Promise<void> => {
  await filmService.permanentDeleteFilm(req.params.id);
  res.status(200).json({ code: 200, message: "Xóa vĩnh viễn film thành công" });
};