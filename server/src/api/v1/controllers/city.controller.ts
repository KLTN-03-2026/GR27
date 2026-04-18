import { Request, Response } from "express";
import * as cityService from "../services/city.service";

// [GET] /api/v1/cities
export const index = async (req: Request, res: Response): Promise<void> => {
  const cities = await cityService.getAllCities();
  res.json(cities);
};

// [GET] /api/v1/cities/:slug
export const show = async (req: Request, res: Response): Promise<void> => {
  const city = await cityService.getCityById(req.params.slug);
  res.json(city);
};