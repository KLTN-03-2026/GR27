import { API_ENDPOINTS } from "../constants";
import { del, get, patch, post } from "../utils";

export const getAllRooms = () => get(API_ENDPOINTS.ROOMS.LIST);

export const createRoom = (data) => post(API_ENDPOINTS.ROOMS.CREATE, data);

export const getRoomById = (id) => get(API_ENDPOINTS.ROOMS.DETAIL(id));

export const updateRoom = (id, data) => patch(API_ENDPOINTS.ROOMS.UPDATE(id), data);

export const deleteRoom = (id) => del(API_ENDPOINTS.ROOMS.DELETE(id));

export const updateRoomStatus = (id, status) =>
  patch(API_ENDPOINTS.ROOMS.UPDATE(id), { status });