import { API_ENDPOINTS } from "../constants";
import { del, get, patch, post } from "../utils";

export const getAllShowTimes = () => get(API_ENDPOINTS.SHOW_TIMES.LIST);

export const getShowTimeById = (id) => get(API_ENDPOINTS.SHOW_TIMES.DETAIL_BY_ID(id));

export const getShowTimeByFilmId = (id) => get(API_ENDPOINTS.SHOW_TIMES.BY_FILM(id));

export const deleteShowTime = (id) => del(API_ENDPOINTS.SHOW_TIMES.DELETE(id));

export const updateShowTime = (id, data) =>
  patch(API_ENDPOINTS.SHOW_TIMES.UPDATE(id), data);

export const updateShowTimeStatus = (id, status) =>
  patch(API_ENDPOINTS.SHOW_TIMES.UPDATE(id), { status });

export const createShowTime = (data) => post(API_ENDPOINTS.SHOW_TIMES.CREATE, data);

// TRASH //
export const getTrashShowTimes = () => {
  return get(API_ENDPOINTS.SHOW_TIMES.TRASH);
};

export const restoreShowTimes = (id) => {
  return patch(API_ENDPOINTS.SHOW_TIMES.UPDATE(id), { deleted: false });
};

export const permanentDeleteShowTime = (id) => {
  return del(API_ENDPOINTS.SHOW_TIMES.DELETE_PERMANENT(id));
};

