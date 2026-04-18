import { Request, Response } from "express";
import * as comboFoodService from "../services/comboFood.service";

// [GET] /api/v1/combofoods
export const index = async (req: Request, res: Response): Promise<void> => {
  const comboFoods = await comboFoodService.getAllComboFoods();
  res.json(comboFoods);
};