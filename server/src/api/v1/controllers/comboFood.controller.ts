
import { Request, Response } from "express";
import ComboFood from "../models/comboFood.model";

//[GET] /api/v1/combofoods
export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    const combofoods = await ComboFood.find();
    if (!combofoods) {
      res.status(404).json({ message: "Không tìm thấy combofoods" });
      return;
    }
    res.json(combofoods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
    return;
  }
}