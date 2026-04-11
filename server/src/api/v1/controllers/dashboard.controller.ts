// src/api/v1/controllers/dashboard.controller.ts
import { Request, Response } from "express";
import Order, { OrderStatus, PaymentStatus } from "../models/order.model";
import User from "../models/user.model";
import Film from "../models/film.model";
import Cinema from "../models/cinema.model";
import Comment from "../models/comment.model";
import { CommonStatus } from "../../../types/common.type";
import { UserStatus } from "../../../types/user.type";

/**
 * [GET] OVERVIEW STATISTICS: /api/v1/dashboard/overview
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getOverview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    // Parallel queries for better performance
    const [
      totalRevenue,
      totalOrders,
      totalTickets,
      totalUsers,
      activeFilms,
      activeCinemas,
      pendingOrders,
      cancelledOrders,
    ] = await Promise.all([
      // Total revenue from confirmed orders
      Order.aggregate([
        {
          $match: {
            orderStatus: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
            deleted: false,
            ...dateFilter,
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),

      // Total orders
      Order.countDocuments({
        deleted: false,
        ...dateFilter,
      }),

      // Total tickets sold (sum of seats in confirmed orders)
      Order.aggregate([
        {
          $match: {
            orderStatus: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
            deleted: false,
            ...dateFilter,
          },
        },
        { $unwind: "$seats" },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),

      // Total users
      User.countDocuments({
        deleted: false,
        status: { $ne: UserStatus.BLOCKED },
        ...dateFilter,
      }),

      // Active films
      Film.countDocuments({
        deleted: false,
        status: CommonStatus.ACTIVE,
      }),

      // Active cinemas
      Cinema.countDocuments({
        deleted: false,
        status: CommonStatus.ACTIVE,
      }),

      // Pending orders
      Order.countDocuments({
        orderStatus: OrderStatus.PENDING,
        deleted: false,
        ...dateFilter,
      }),

      // Cancelled orders
      Order.countDocuments({
        orderStatus: OrderStatus.CANCELLED,
        deleted: false,
        ...dateFilter,
      }),
    ]);

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: {
        revenue: {
          total: totalRevenue[0]?.total || 0,
          currency: "VND",
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          cancelled: cancelledOrders,
          confirmed: totalOrders - pendingOrders - cancelledOrders,
        },
        tickets: {
          sold: totalTickets[0]?.count || 0,
        },
        users: {
          total: totalUsers,
        },
        films: {
          active: activeFilms,
        },
        cinemas: {
          active: activeCinemas,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [GET] REVENUE CHART: /api/v1/dashboard/revenue-chart
 * Query params: ?period=day|week|month&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getRevenueChart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { period = "day", startDate, endDate } = req.query;

    // Default to last 30 days if no date range provided
    const end = endDate
      ? new Date(endDate as string)
      : new Date();
    end.setHours(23, 59, 59, 999);

    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    // Determine grouping format
    let groupFormat: any = {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
      day: { $dayOfMonth: "$createdAt" },
    };

    if (period === "week") {
      groupFormat = {
        year: { $year: "$createdAt" },
        week: { $week: "$createdAt" },
      };
    } else if (period === "month") {
      groupFormat = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          orderStatus: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          deleted: false,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: "$totalAmount" },
          seatRevenue: { $sum: "$seatSubtotal" },
          comboRevenue: { $sum: "$comboSubtotal" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: revenueData.map((item) => ({
        date: item._id,
        revenue: item.revenue,
        seatRevenue: item.seatRevenue,
        comboRevenue: item.comboRevenue,
        orderCount: item.orderCount,
      })),
    });
  } catch (error) {
    console.error("Revenue chart error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [GET] TOP FILMS: /api/v1/dashboard/top-films
 * Query params: ?type=revenue|rating|bookings&limit=5&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getTopFilms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      type = "revenue",
      limit = "10",
      startDate,
      endDate,
    } = req.query;
    const limitNum = parseInt(limit as string);

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    if (type === "revenue" || type === "bookings") {
      // Top by revenue or bookings
      const topFilms = await Order.aggregate([
        {
          $match: {
            orderStatus: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
            deleted: false,
            ...dateFilter,
          },
        },
        {
          $lookup: {
            from: "showtimes",
            localField: "showtimeId",
            foreignField: "_id",
            as: "showtime",
          },
        },
        { $unwind: "$showtime" },
        {
          $group: {
            _id: "$showtime.filmId",
            revenue: { $sum: "$totalAmount" },
            bookings: { $sum: 1 },
            tickets: { $sum: { $size: "$seats" } },
          },
        },
        {
          $sort: type === "revenue" ? { revenue: -1 } : { bookings: -1 },
        },
        { $limit: limitNum },
        {
          $lookup: {
            from: "films",
            localField: "_id",
            foreignField: "_id",
            as: "film",
          },
        },
        { $unwind: "$film" },
        {
          $project: {
            filmId: "$_id",
            title: "$film.title",
            thumbnail: "$film.thumbnail",
            revenue: 1,
            bookings: 1,
            tickets: 1,
          },
        },
      ]);

      res.status(200).json({
        code: 200,
        message: "Thành công",
        data: topFilms,
      });
    } else if (type === "rating") {
      // Top by rating
      const topFilms = await Comment.aggregate([
        {
          $group: {
            _id: "$filmId",
            averageRating: { $avg: "$rate" },
            totalComments: { $sum: 1 },
          },
        },
        { $match: { totalComments: { $gte: 1 } } },
        { $sort: { averageRating: -1 } },
        { $limit: limitNum },
        {
          $lookup: {
            from: "films",
            localField: "_id",
            foreignField: "_id",
            as: "film",
          },
        },
        { $unwind: "$film" },
        {
          $project: {
            filmId: "$_id",
            title: "$film.title",
            thumbnail: "$film.thumbnail",
            averageRating: { $round: ["$averageRating", 1] },
            totalComments: 1,
          },
        },
      ]);

      res.status(200).json({
        code: 200,
        message: "Thành công",
        data: topFilms,
      });
    } else {
      res.status(400).json({
        code: 400,
        message: "Type không hợp lệ. Chỉ chấp nhận: revenue, rating, bookings",
      });
    }
  } catch (error) {
    console.error("Top films error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [GET] REVENUE BY CINEMA: /api/v1/dashboard/revenue-by-cinema
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=10
 */
export const getRevenueByCinema = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, limit = "10" } = req.query;
    const limitNum = parseInt(limit as string);

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const revenueByCinema = await Order.aggregate([
      {
        $match: {
          orderStatus: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          deleted: false,
          ...dateFilter,
        },
      },
      {
        $lookup: {
          from: "showtimes",
          localField: "showtimeId",
          foreignField: "_id",
          as: "showtime",
        },
      },
      { $unwind: "$showtime" },
      {
        $group: {
          _id: "$showtime.cinemaId",
          revenue: { $sum: "$totalAmount" },
          bookings: { $sum: 1 },
          tickets: { $sum: { $size: "$seats" } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limitNum },
      {
        $lookup: {
          from: "cinemas",
          localField: "_id",
          foreignField: "_id",
          as: "cinema",
        },
      },
      { $unwind: "$cinema" },
      {
        $project: {
          cinemaId: "$_id",
          name: "$cinema.name",
          address: "$cinema.address",
          revenue: 1,
          bookings: 1,
          tickets: 1,
        },
      },
    ]);

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: revenueByCinema,
    });
  } catch (error) {
    console.error("Revenue by cinema error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [GET] USER GROWTH: /api/v1/dashboard/user-growth
 * Query params: ?period=day|week|month&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getUserGrowth = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { period = "day", startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    let groupFormat: any = {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
      day: { $dayOfMonth: "$createdAt" },
    };

    if (period === "week") {
      groupFormat = {
        year: { $year: "$createdAt" },
        week: { $week: "$createdAt" },
      };
    } else if (period === "month") {
      groupFormat = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };
    }

    const userData = await User.aggregate([
      {
        $match: {
          deleted: false,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: groupFormat,
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: userData.map((item) => ({
        date: item._id,
        newUsers: item.newUsers,
      })),
    });
  } catch (error) {
    console.error("User growth error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [GET] COMMENT STATISTICS: /api/v1/dashboard/comment-stats
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getCommentStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const [totalComments, reportedComments, ratingDistribution] =
      await Promise.all([
        Comment.countDocuments(dateFilter),

        Comment.countDocuments({
          isReported: true,
          ...dateFilter,
        }),

        Comment.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: "$rate",
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    const reportRate =
      totalComments > 0
        ? ((reportedComments / totalComments) * 100).toFixed(2)
        : "0.00";

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: {
        total: totalComments,
        reported: reportedComments,
        reportRate: `${reportRate}%`,
        ratingDistribution: ratingDistribution.map((item) => ({
          rating: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error("Comment stats error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [GET] SEAT TYPE STATISTICS: /api/v1/dashboard/seat-type-stats
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getSeatTypeStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const seatStats = await Order.aggregate([
      {
        $match: {
          orderStatus: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          deleted: false,
          ...dateFilter,
        },
      },
      { $unwind: "$seats" },
      {
        $group: {
          _id: "$seats.type",
          count: { $sum: 1 },
          revenue: { $sum: "$seats.unitPrice" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: seatStats.map((item) => ({
        type: item._id,
        count: item.count,
        revenue: item.revenue,
      })),
    });
  } catch (error) {
    console.error("Seat type stats error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * [GET] FORMAT STATISTICS: /api/v1/dashboard/format-stats
 * Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getFormatStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const formatStats = await Order.aggregate([
      {
        $match: {
          orderStatus: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          deleted: false,
          ...dateFilter,
        },
      },
      {
        $lookup: {
          from: "showtimes",
          localField: "showtimeId",
          foreignField: "_id",
          as: "showtime",
        },
      },
      { $unwind: "$showtime" },
      {
        $group: {
          _id: "$showtime.format",
          revenue: { $sum: "$totalAmount" },
          bookings: { $sum: 1 },
          tickets: { $sum: { $size: "$seats" } },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: formatStats.map((item) => ({
        format: item._id,
        revenue: item.revenue,
        bookings: item.bookings,
        tickets: item.tickets,
      })),
    });
  } catch (error) {
    console.error("Format stats error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};