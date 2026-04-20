import { API_ENDPOINTS } from "../constants";
import { del, get, patch, post } from "../utils";

export const getAllCinema = () => get(API_ENDPOINTS.CINEMAS.LIST);

export const createCinema = (data) => post(API_ENDPOINTS.CINEMAS.CREATE, data);

export const getCinemaById = (id) => get(API_ENDPOINTS.CINEMAS.DETAIL_BY_ID(id));

export const getCinemaBySlug = (slug) =>
  get(API_ENDPOINTS.CINEMAS.DETAIL_BY_SLUG(slug));

export const updateCinema = (id, data) =>
  patch(API_ENDPOINTS.CINEMAS.UPDATE(id), data);


export const deleteCinema = (id) => del(API_ENDPOINTS.CINEMAS.DELETE(id));

  
export const updateCinemaStatus = (id, status) =>
  patch(API_ENDPOINTS.CINEMAS.UPDATE(id), { status });

// TRASH //
export const getTrashCinema = () => {
  return get(API_ENDPOINTS.CINEMAS.TRASH);
};

export const restoreCinema = (id) => {
  return patch(API_ENDPOINTS.CINEMAS.UPDATE(id), { deleted: false });
};

export const permanentDeleteCinema = (id) => {
  return del(API_ENDPOINTS.CINEMAS.DELETE_PERMANENT(id));
};