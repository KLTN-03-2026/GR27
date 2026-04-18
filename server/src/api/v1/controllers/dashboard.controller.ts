import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";

// [GET] /api/v1/dashboard/overview
export const getOverview = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query as Record<string, string>;
  const data = await dashboardService.getOverview(startDate, endDate);
  res.status(200).json({ code: 200, message: "Thành công", data });
};

// [GET] /api/v1/dashboard/revenue-chart
export const getRevenueChart = async (req: Request, res: Response): Promise<void> => {
  const { period, startDate, endDate } = req.query as Record<string, string>;
  const data = await dashboardService.getRevenueChart(period, startDate, endDate);
  res.status(200).json({ code: 200, message: "Thành công", data });
};

// [GET] /api/v1/dashboard/top-films
export const getTopFilms = async (req: Request, res: Response): Promise<void> => {
  const { type, limit, startDate, endDate } = req.query as Record<string, string>;
  const data = await dashboardService.getTopFilms(type, parseInt(limit) || 10, startDate, endDate);
  res.status(200).json({ code: 200, message: "Thành công", data });
};

// [GET] /api/v1/dashboard/revenue-by-cinema
export const getRevenueByCinema = async (req: Request, res: Response): Promise<void> => {
  const { limit, startDate, endDate } = req.query as Record<string, string>;
  const data = await dashboardService.getRevenueByCinema(parseInt(limit) || 10, startDate, endDate);
  res.status(200).json({ code: 200, message: "Thành công", data });
};

// [GET] /api/v1/dashboard/user-growth
export const getUserGrowth = async (req: Request, res: Response): Promise<void> => {
  const { period, startDate, endDate } = req.query as Record<string, string>;
  const data = await dashboardService.getUserGrowth(period, startDate, endDate);
  res.status(200).json({ code: 200, message: "Thành công", data });
};

// [GET] /api/v1/dashboard/comment-stats
export const getCommentStats = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query as Record<string, string>;
  const data = await dashboardService.getCommentStats(startDate, endDate);
  res.status(200).json({ code: 200, message: "Thành công", data });
};

// [GET] /api/v1/dashboard/seat-type-stats
export const getSeatTypeStats = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query as Record<string, string>;
  const data = await dashboardService.getSeatTypeStats(startDate, endDate);
  res.status(200).json({ code: 200, message: "Thành công", data });
};

// [GET] /api/v1/dashboard/format-stats
export const getFormatStats = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query as Record<string, string>;
  const data = await dashboardService.getFormatStats(startDate, endDate);
  res.status(200).json({ code: 200, message: "Thành công", data });
};