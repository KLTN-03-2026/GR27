import Order, { OrderStatus, PaymentStatus } from "../models/order.model";
import User from "../models/user.model";
import Film from "../models/film.model";
import Cinema from "../models/cinema.model";
import Comment from "../models/comment.model";
import { CommonStatus } from "../../../types/common.type";
import { UserStatus } from "../../../types/user.type";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build dateFilter cho createdAt từ startDate/endDate string.
 * Dùng chung cho tất cả các hàm dashboard.
 */
const buildDateFilter = (startDate?: string, endDate?: string): any => {
  if (!startDate && !endDate) return {};

  const filter: any = { createdAt: {} };
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    filter.createdAt.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.createdAt.$lte = end;
  }
  return filter;
};

/**
 * Build groupFormat cho aggregate theo period (day/week/month).
 */
const buildGroupFormat = (period: string): any => {
  if (period === "week") {
    return { year: { $year: "$createdAt" }, week: { $week: "$createdAt" } };
  }
  if (period === "month") {
    return { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };
  }
  // default: day
  return {
    year: { $year: "$createdAt" },
    month: { $month: "$createdAt" },
    day: { $dayOfMonth: "$createdAt" },
  };
};

/** Match condition cho các order đã thanh toán thành công */
const PAID_ORDER_MATCH = {
  orderStatus: OrderStatus.CONFIRMED,
  paymentStatus: PaymentStatus.PAID,
  deleted: false,
};

// ── Service functions ────────────────────────────────────────────────────────

export const getOverview = async (startDate?: string, endDate?: string) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  const [
    totalRevenueAgg,
    totalOrders,
    totalTicketsAgg,
    totalUsers,
    activeFilms,
    activeCinemas,
    pendingOrders,
    cancelledOrders,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { ...PAID_ORDER_MATCH, ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments({ deleted: false, ...dateFilter }),
    Order.aggregate([
      { $match: { ...PAID_ORDER_MATCH, ...dateFilter } },
      { $unwind: "$seats" },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]),
    User.countDocuments({ deleted: false, status: { $ne: UserStatus.BLOCKED }, ...dateFilter }),
    Film.countDocuments({ deleted: false, status: CommonStatus.ACTIVE }),
    Cinema.countDocuments({ deleted: false, status: CommonStatus.ACTIVE }),
    Order.countDocuments({ orderStatus: OrderStatus.PENDING, deleted: false, ...dateFilter }),
    Order.countDocuments({ orderStatus: OrderStatus.CANCELLED, deleted: false, ...dateFilter }),
  ]);

  return {
    revenue: { total: totalRevenueAgg[0]?.total || 0, currency: "VND" },
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      cancelled: cancelledOrders,
      confirmed: totalOrders - pendingOrders - cancelledOrders,
    },
    tickets: { sold: totalTicketsAgg[0]?.count || 0 },
    users: { total: totalUsers },
    films: { active: activeFilms },
    cinemas: { active: activeCinemas },
  };
};

export const getRevenueChart = async (period = "day", startDate?: string, endDate?: string) => {
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);

  const groupFormat = buildGroupFormat(period);

  const data = await Order.aggregate([
    { $match: { ...PAID_ORDER_MATCH, createdAt: { $gte: start, $lte: end } } },
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

  return data.map((item) => ({
    date: item._id,
    revenue: item.revenue,
    seatRevenue: item.seatRevenue,
    comboRevenue: item.comboRevenue,
    orderCount: item.orderCount,
  }));
};

export const getTopFilms = async (type = "revenue", limit = 10, startDate?: string, endDate?: string) => {
  const VALID_TYPES = ["revenue", "rating", "bookings"];
  if (!VALID_TYPES.includes(type)) {
    throw { status: 400, message: "Type không hợp lệ. Chỉ chấp nhận: revenue, rating, bookings" };
  }

  const dateFilter = buildDateFilter(startDate, endDate);

  if (type === "rating") {
    return Comment.aggregate([
      { $group: { _id: "$filmId", averageRating: { $avg: "$rate" }, totalComments: { $sum: 1 } } },
      { $match: { totalComments: { $gte: 1 } } },
      { $sort: { averageRating: -1 } },
      { $limit: limit },
      { $lookup: { from: "films", localField: "_id", foreignField: "_id", as: "film" } },
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
  }

  // revenue hoặc bookings
  return Order.aggregate([
    { $match: { ...PAID_ORDER_MATCH, ...dateFilter } },
    { $lookup: { from: "showtimes", localField: "showtimeId", foreignField: "_id", as: "showtime" } },
    { $unwind: "$showtime" },
    {
      $group: {
        _id: "$showtime.filmId",
        revenue: { $sum: "$totalAmount" },
        bookings: { $sum: 1 },
        tickets: { $sum: { $size: "$seats" } },
      },
    },
    { $sort: type === "revenue" ? { revenue: -1 } : { bookings: -1 } },
    { $limit: limit },
    { $lookup: { from: "films", localField: "_id", foreignField: "_id", as: "film" } },
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
};

export const getRevenueByCinema = async (limit = 10, startDate?: string, endDate?: string) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  return Order.aggregate([
    { $match: { ...PAID_ORDER_MATCH, ...dateFilter } },
    { $lookup: { from: "showtimes", localField: "showtimeId", foreignField: "_id", as: "showtime" } },
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
    { $limit: limit },
    { $lookup: { from: "cinemas", localField: "_id", foreignField: "_id", as: "cinema" } },
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
};

export const getUserGrowth = async (period = "day", startDate?: string, endDate?: string) => {
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);

  const groupFormat = buildGroupFormat(period);

  const data = await User.aggregate([
    { $match: { deleted: false, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: groupFormat, newUsers: { $sum: 1 } } },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  return data.map((item) => ({ date: item._id, newUsers: item.newUsers }));
};

export const getCommentStats = async (startDate?: string, endDate?: string) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  const [totalComments, reportedComments, ratingDistribution] = await Promise.all([
    Comment.countDocuments(dateFilter),
    Comment.countDocuments({ isReported: true, ...dateFilter }),
    Comment.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$rate", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const reportRate = totalComments > 0
    ? ((reportedComments / totalComments) * 100).toFixed(2)
    : "0.00";

  return {
    total: totalComments,
    reported: reportedComments,
    reportRate: `${reportRate}%`,
    ratingDistribution: ratingDistribution.map((item) => ({ rating: item._id, count: item.count })),
  };
};

export const getSeatTypeStats = async (startDate?: string, endDate?: string) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  const data = await Order.aggregate([
    { $match: { ...PAID_ORDER_MATCH, ...dateFilter } },
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

  return data.map((item) => ({ type: item._id, count: item.count, revenue: item.revenue }));
};

export const getFormatStats = async (startDate?: string, endDate?: string) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  const data = await Order.aggregate([
    { $match: { ...PAID_ORDER_MATCH, ...dateFilter } },
    { $lookup: { from: "showtimes", localField: "showtimeId", foreignField: "_id", as: "showtime" } },
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

  return data.map((item) => ({
    format: item._id,
    revenue: item.revenue,
    bookings: item.bookings,
    tickets: item.tickets,
  }));
};