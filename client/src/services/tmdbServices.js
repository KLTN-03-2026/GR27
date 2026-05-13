import { API_ENDPOINTS } from "../constants";
import { get } from "../utils";

// Tìm kiếm phim theo tên
export const searchTmdbFilms = (query) =>
  get(`${API_ENDPOINTS.TMDB.SEARCH}?query=${encodeURIComponent(query)}&language=vi-VN`);

// Lấy chi tiết phim đã được map sẵn
export const getTmdbFilmDetail = (tmdbId) =>
  get(`${API_ENDPOINTS.TMDB.DETAIL(tmdbId)}?language=vi-VN`);