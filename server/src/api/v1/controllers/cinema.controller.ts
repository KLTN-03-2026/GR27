import { Request, Response } from "express";
import * as cinemaService from "../services/cinema.service";
import { ICinemaCreate, ICinemaUpdate } from "../../../types/cinema.type";

// [GET] /api/v1/cinemas
export const index = async (req: Request, res: Response): Promise<void> => {
  const cinemas = await cinemaService.getAllCinemas(req.user?.role);
  res.status(200).json(cinemas);
};

// [GET] /api/v1/cinemas/slug/:slug
export const getBySlug = async (req: Request, res: Response): Promise<void> => {
  const cinema = await cinemaService.getCinemaBySlug(req.params.slug);
  res.status(200).json(cinema);
};

// [GET] /api/v1/cinemas/:id
export const getById = async (req: Request, res: Response): Promise<void> => {
  const cinema = await cinemaService.getCinemaById(req.params.id);
  res.status(200).json({ code: 200, message: "Thành công", data: cinema });
};

// [POST] /api/v1/cinemas
export const create = async (req: Request, res: Response): Promise<void> => {
  const cinema = await cinemaService.createCinema(req.body as ICinemaCreate);
  res.status(201).json(cinema);
};

// [PATCH] /api/v1/cinemas/:id
export const edit = async (req: Request, res: Response): Promise<void> => {
  const cinema = await cinemaService.updateCinema(req.params.id, req.body as ICinemaUpdate);
  res.status(200).json(cinema);
};

// [DELETE] /api/v1/cinemas/:id
export const remove = async (req: Request, res: Response): Promise<void> => {
  await cinemaService.deleteCinema(req.params.id);
  res.status(200).json({ code: 200, message: "Xóa rạp chiếu thành công" });
};