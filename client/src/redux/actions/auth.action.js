// src/redux/actions/auth.action.js
import { checkLogin } from "../../services/authServices";

// Action types
export const SET_USER = "SET_USER";
export const LOGOUT = "LOGOUT";
export const AUTH_LOADING = "AUTH_LOADING";
export const AUTH_ERROR = "AUTH_ERROR";

// Thunk Action: gọi API và lưu user vào store
export const fetchUser = () => async (dispatch) => {
  try {
    dispatch({ type: AUTH_LOADING }); // 👈 bắt đầu loading
    
    const check = await checkLogin();
    dispatch({ type: SET_USER, payload: check.user });
  } catch (error) {
    console.error("Lỗi lấy user:", error.response?.data || error.message);
    
    // 👈 dispatch lỗi thay vì chỉ logout
    dispatch({ 
      type: AUTH_ERROR, 
      payload: error.response?.data?.message || "Không thể xác thực người dùng" 
    });
    
    dispatch({ type: LOGOUT }); // Token sai, hết hạn => logout
  }
};