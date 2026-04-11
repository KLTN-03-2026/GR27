import { API_ENDPOINTS } from "../constants";
import { del, get, patch, post } from "../utils";

export const createFilm = (data) => post(API_ENDPOINTS.FILMS.CREATE, data);

// Get all films
export const getAllFilms = () => get(API_ENDPOINTS.FILMS.LIST);

//get single film by id
export const getFilmById = (id) => get(API_ENDPOINTS.FILMS.DETAIL_BY_ID(id));

// Get single film by slug
export const getFilmBySlug = (slug) =>
  get(API_ENDPOINTS.FILMS.DETAIL_BY_SLUG(slug));

// Update existing film
export const updateFilm = (id, data) =>
  patch(API_ENDPOINTS.FILMS.UPDATE(id), data);

// Delete film
export const deleteFilm = (id) => del(API_ENDPOINTS.FILMS.DELETE(id));

// Update film status (active/inactive)
export const updateFilmStatus = (id, status) =>
  patch(API_ENDPOINTS.FILMS.UPDATE(id), { status });

// Update film trending status
export const updateFilmTrending = (id, isTrending) =>
  patch(API_ENDPOINTS.FILMS.UPDATE(id), { isTrending });
