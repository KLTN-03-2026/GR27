import { Request, Response } from "express";
import * as uploadService from "../services/upload.service";

// [GET] /api/v1/upload — dùng cho TinyMCE hiển thị ảnh đã upload
export const index = (req: Request, res: Response): void => {
  res.json({ location: req.body.file });
};

// [POST] /api/v1/upload/image
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ code: 400, message: "Không có file được gửi lên" });
    return;
  }

  const url = await uploadService.uploadImage(req.file.buffer);
  res.json({ code: 200, url });
};