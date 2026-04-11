import Category from "../models/category.model";
import { Request, Response } from "express";

// [GET] /api/v1/categories
export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find();
    if (!categories) {
      res.status(404).json({ message: "Không tìm thấy danh mục" });
      return;
    }
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
    return;
  }
};
