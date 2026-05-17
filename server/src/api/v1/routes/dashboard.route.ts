// src/api/v1/routes/dashboard.route.ts
import { Router } from "express";
const router: Router = Router();

import * as dashboardController from "../controllers/dashboard.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { UserRole } from "../../../types/user.type";


// [GET] OVERVIEW STATISTICS: /api/v1/dashboard/overview
// Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get(
  "/overview",
  authMiddleware(UserRole.ADMIN),
  dashboardController.getOverview
);

// [GET] REVENUE CHART: /api/v1/dashboard/revenue-chart
// Query: ?period=day|week|month&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get(
  "/revenue-chart",
  authMiddleware(UserRole.ADMIN),
  dashboardController.getRevenueChart
);

// [GET] TOP FILMS: /api/v1/dashboard/top-films
// Query: ?type=revenue|rating|bookings&limit=5&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get(
  "/top-films",
  authMiddleware(UserRole.ADMIN),
  dashboardController.getTopFilms
);

// [GET] REVENUE BY CINEMA: /api/v1/dashboard/revenue-by-cinema
// Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=10
router.get(
  "/revenue-by-cinema",
  authMiddleware(UserRole.ADMIN),
  dashboardController.getRevenueByCinema
);

// [GET] USER GROWTH: /api/v1/dashboard/user-growth
// Query: ?period=day|week|month&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get(
  "/user-growth",
  authMiddleware(UserRole.ADMIN),
  dashboardController.getUserGrowth
);

// [GET] COMMENT STATISTICS: /api/v1/dashboard/comment-stats
// Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get(
  "/comment-stats",
  authMiddleware(UserRole.ADMIN),
  dashboardController.getCommentStats
);

// [GET] SEAT TYPE STATISTICS: /api/v1/dashboard/seat-type-stats
// Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get(
  "/seat-type-stats",
  authMiddleware(UserRole.ADMIN),
  dashboardController.getSeatTypeStats
);

// [GET] FORMAT STATISTICS: /api/v1/dashboard/format-stats
// Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get(
  "/format-stats",
  authMiddleware(UserRole.ADMIN),
  dashboardController.getFormatStats
);

export default router;