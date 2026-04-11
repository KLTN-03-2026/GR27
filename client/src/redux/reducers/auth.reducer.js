// src/redux/reducers/auth.reducer.js
import { ROLES } from "../../constants";
import { SET_USER, LOGOUT } from "../actions/auth.action";

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,    // 👈 trạng thái đang tải
  error: null,       // 👈 lưu lỗi nếu có
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case "AUTH_LOADING":
      return {
        ...state,
        loading: true,
        error: null,
      };
    
    case SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,    // 👈 tắt loading
        error: null,
      };
    
    case LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    
    case "AUTH_ERROR":
      return {
        ...state,
        loading: false,
        error: action.payload, // 👈 lưu thông báo lỗi
      };
    
    default:
      return state;
  }
};
//  Helper function để check role
export const isAdmin = (user) => user?.role === ROLES.ADMIN;
export const isUser = (user) => user?.role === ROLES.USER;

export default authReducer;