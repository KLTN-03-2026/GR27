import { get } from "../utils";

export const getOverviewStats = (params) => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return get(`/dashboard/overview${query}`);
};

export const getRevenueChart = (params) => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return get(`/dashboard/revenue-chart${query}`);
};

export const getTopFilms = (params) => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return get(`/dashboard/top-films${query}`);
};

export const getRevenueByCinema = (params) => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return get(`/dashboard/revenue-by-cinema${query}`);
};

export const getUserGrowth = (params) => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return get(`/dashboard/user-growth${query}`);
};

export const getCommentStats = (params) => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return get(`/dashboard/comment-stats${query}`);
};

export const getSeatTypeStats = (params) => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return get(`/dashboard/seat-type-stats${query}`);
};

export const getFormatStats = (params) => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return get(`/dashboard/format-stats${query}`);
};