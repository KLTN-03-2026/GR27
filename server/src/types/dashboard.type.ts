// src/types/dashboard.type.ts

/**
 * Overview Statistics Response
 */
export interface IOverviewStats {
  revenue: {
    total: number;
    currency: string;
  };
  orders: {
    total: number;
    pending: number;
    cancelled: number;
    confirmed: number;
  };
  tickets: {
    sold: number;
  };
  users: {
    total: number;
  };
  films: {
    active: number;
  };
  cinemas: {
    active: number;
  };
}

/**
 * Revenue Chart Data Point
 */
export interface IRevenueChartData {
  date: {
    year: number;
    month?: number;
    day?: number;
    week?: number;
  };
  revenue: number;
  seatRevenue: number;
  comboRevenue: number;
  orderCount: number;
}

/**
 * Top Film Data
 */
export interface ITopFilm {
  filmId: string;
  title: string;
  thumbnail: string;
  revenue?: number;
  bookings?: number;
  tickets?: number;
  averageRating?: number;
  totalComments?: number;
}

/**
 * Revenue by Cinema Data
 */
export interface IRevenueByCinema {
  cinemaId: string;
  name: string;
  address: string;
  revenue: number;
  bookings: number;
  tickets: number;
}

/**
 * User Growth Data Point
 */
export interface IUserGrowthData {
  date: {
    year: number;
    month?: number;
    day?: number;
    week?: number;
  };
  newUsers: number;
}

/**
 * Comment Statistics
 */
export interface ICommentStats {
  total: number;
  reported: number;
  reportRate: string;
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
}

/**
 * Seat Type Statistics
 */
export interface ISeatTypeStats {
  type: string;
  count: number;
  revenue: number;
}

/**
 * Format Statistics
 */
export interface IFormatStats {
  format: string;
  revenue: number;
  bookings: number;
  tickets: number;
}

/**
 * Dashboard Query Params
 */
export interface IDashboardQuery {
  startDate?: string;
  endDate?: string;
  period?: "day" | "week" | "month";
  type?: "revenue" | "rating" | "bookings";
  limit?: string;
}