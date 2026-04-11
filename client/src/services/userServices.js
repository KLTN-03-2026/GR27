import {get, patch} from "../utils";
import { API_ENDPOINTS } from "../constants";

export const  updateProfile = (data) => patch(API_ENDPOINTS.USERS.UPDATE_PROFILE, data);

export const changePassword = (data) => patch(API_ENDPOINTS.USERS.CHANGE_PASSWORD, data);


// Admin operations
export const getAllUsers = (params) => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return get(`${API_ENDPOINTS.USERS.LIST}${query}`);
};

export const getUserById = (id) => get(API_ENDPOINTS.USERS.DETAIL(id));

export const updateUserRole = (id, role) => 
  patch(API_ENDPOINTS.USERS.UPDATE_ROLE(id), { role });

export const updateUserStatus = (id, status) => 
  patch(API_ENDPOINTS.USERS.UPDATE_STATUS(id), { status });