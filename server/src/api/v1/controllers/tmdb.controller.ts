import { Request, Response } from "express";
import * as tmdbService from "../services/tmdb.service";

// [GET] /api/v1/tmdb/search?query=avengers&language=vi-VN
export const searchFilms = async (req: Request, res: Response): Promise<void> => {
  const { query, language = "vi-VN" } = req.query;

  if (!query || typeof query !== "string" || !query.trim()) {
    res.status(400).json({ code: 400, message: "Thiếu query tìm kiếm" });
    return;
  }

  const results = await tmdbService.searchFilms(query.trim(), language as string);
  
  res.status(200).json({ code: 200, message: "Thành công", data: results });
};

// [GET] /api/v1/tmdb/:tmdbId?language=vi-VN
export const getFilmDetail = async (req: Request, res: Response): Promise<void> => {
  const { tmdbId } = req.params;
  const { language = "vi-VN" } = req.query;

  if (!tmdbId) {
    res.status(400).json({ code: 400, message: "Thiếu TMDb ID" });
    return;
  }

  const mapped = await tmdbService.getAndMapFilmDetail(tmdbId, language as string);
  res.status(200).json({ code: 200, message: "Thành công", data: mapped });
};