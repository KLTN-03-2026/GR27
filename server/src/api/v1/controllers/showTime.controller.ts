import { Request, Response } from "express";
import * as showTimeService from "../services/showTime.service";
import { IShowTimeCreate, IShowTimeUpdate } from "../../../types/showTime.type";
import { UserRole } from "../../../types/user.type";

const isAdmin = (req: Request) => req.user?.role === UserRole.ADMIN;

// [GET] /api/v1/show-times
export const index = async (req: Request, res: Response): Promise<void> => {
  const { status, filmId, cinemaId, roomId, startDate, endDate } = req.query as Record<string, string>;
  const page = parseInt(req.query.page as string) || 1;

  const result = await showTimeService.getShowTimes({
    page, isAdmin: isAdmin(req), status, filmId, cinemaId, roomId, startDate, endDate,
  });

  res.status(200).json({
    code: 200,
    message: "Thành công",
    data: result.showtimes,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
};

// [GET] /api/v1/show-times/trash  (admin)
export const getTrash = async (req: Request, res: Response): Promise<void> => {
  const showtimes = await showTimeService.getTrashedShowTimes();
  res.status(200).json({ code: 200, message: "Thành công", data: showtimes });
};

// [GET] /api/v1/show-times/film/:filmId
export const getByFilmId = async (req: Request, res: Response): Promise<void> => {
  const { cinemaId, cityId, format, startDate, endDate } = req.query as Record<string, string>;

  const result = await showTimeService.getShowTimesByFilmId(
    req.params.filmId,
    isAdmin(req),
    { cinemaId, cityId, format, startDate, endDate }
  );

  res.status(200).json({ code: 200, message: "Thành công", data: result });
};

// [GET] /api/v1/show-times/cinema/:cinemaId
export const getByCinemaId = async (req: Request, res: Response): Promise<void> => {
  const result = await showTimeService.getShowTimesByCinemaId(
    req.params.cinemaId,
    req.query.date as string
  );

  res.status(200).json({ code: 200, message: "Thành công", data: result });
};

// [GET] /api/v1/show-times/:id
export const getById = async (req: Request, res: Response): Promise<void> => {
  const showtime = await showTimeService.getShowTimeById(req.params.id, isAdmin(req));
  res.status(200).json({ code: 200, message: "Thành công", data: showtime });
};

// [POST] /api/v1/show-times
export const create = async (req: Request, res: Response): Promise<void> => {
  const showtime = await showTimeService.createShowTime(req.body as IShowTimeCreate);
  res.status(201).json({ code: 201, message: "Tạo suất chiếu thành công", data: showtime });
};

// [POST] /api/v1/show-times/bulk
export const createBulk = async (req: Request, res: Response): Promise<void> => {
  const { showtimes } = req.body;
  const result = await showTimeService.createBulkShowTimes(showtimes);
  res.status(200).json({
    code: 200,
    message: `Tạo hàng loạt hoàn tất: ${result.created} thành công, ${result.skipped} bỏ qua`,
    data: result,
  });
};

// [PATCH] /api/v1/show-times/:id
export const edit = async (req: Request, res: Response): Promise<void> => {
  const showtime = await showTimeService.updateShowTime(req.params.id, req.body as IShowTimeUpdate);
  res.status(200).json({ code: 200, message: "Cập nhật suất chiếu thành công", data: showtime });
};

// [DELETE] /api/v1/show-times/:id  — xóa mềm
export const remove = async (req: Request, res: Response): Promise<void> => {
  await showTimeService.deleteShowTime(req.params.id);
  res.status(200).json({ code: 200, message: "Xóa suất chiếu thành công" });
};

// [DELETE] /api/v1/show-times/:id/permanent  — xóa vĩnh viễn
export const permanentDelete = async (req: Request, res: Response): Promise<void> => {
  await showTimeService.permanentDeleteShowTime(req.params.id);
  res.status(200).json({ code: 200, message: "Xóa vĩnh viễn suất chiếu thành công" });
};