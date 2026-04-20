import { Request, Response } from "express";
import * as roomService from "../services/room.service";
import { IRoomCreate, IRoomUpdate } from "../../../types/room.type";

// [GET] /api/v1/rooms
export const index = async (req: Request, res: Response): Promise<void> => {
  const rooms = await roomService.getAllRooms(req.user?.role);
  res.status(200).json({ code: 200, message: "Thành công", data: rooms });
};

// [GET] /api/v1/rooms/trash  (admin)
export const getTrash = async (req: Request, res: Response): Promise<void> => {
  const rooms = await roomService.getTrashedRooms();
  res.status(200).json({ code: 200, message: "Thành công", data: rooms });
};

// [GET] /api/v1/rooms/:id  (admin)
export const getById = async (req: Request, res: Response): Promise<void> => {
  const room = await roomService.getRoomById(req.params.id);
  res.status(200).json({ code: 200, message: "Thành công", data: room });
};

// [POST] /api/v1/rooms
export const create = async (req: Request, res: Response): Promise<void> => {
  const room = await roomService.createRoom(req.body as IRoomCreate);
  res.status(201).json({ code: 201, message: "Tạo phòng chiếu thành công", data: room });
};

// [PATCH] /api/v1/rooms/:id  — edit hoặc khôi phục ({ deleted: false })
export const edit = async (req: Request, res: Response): Promise<void> => {
  const room = await roomService.updateRoom(req.params.id, req.body as IRoomUpdate);
  res.status(200).json({ code: 200, message: "Cập nhật phòng chiếu thành công", data: room });
};

// [DELETE] /api/v1/rooms/:id  — xóa mềm
export const remove = async (req: Request, res: Response): Promise<void> => {
  await roomService.deleteRoom(req.params.id);
  res.status(200).json({ code: 200, message: "Xóa phòng chiếu thành công" });
};

// [DELETE] /api/v1/rooms/:id/permanent  — xóa vĩnh viễn (chỉ room trong trash)
export const permanentDelete = async (req: Request, res: Response): Promise<void> => {
  await roomService.permanentDeleteRoom(req.params.id);
  res.status(200).json({ code: 200, message: "Xóa vĩnh viễn phòng chiếu thành công" });
};