import { Request, Response } from "express";
import * as categoryService from "../services/category.service";

// [GET] /api/v1/categories
export const index = async (req: Request, res: Response): Promise<void> => {
  const categories = await categoryService.getAllCategories();
  res.json(categories);
};