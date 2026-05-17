// services/axiosClient.js
import axios from "axios";
//  Sử dụng environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api/v1";

const axiosClient = axios.create({
  baseURL: API_BASE_URL, 
  withCredentials: true,           
  headers: {
    "Content-Type": "application/json",
  },
});

//  Interceptors (tùy chọn): thêm token hoặc xử lý lỗi chung
axiosClient.interceptors.request.use(
  (config) => {
    // Nếu dùng localStorage token thì thêm ở đây (cách 1 - header)
    // const token = localStorage.getItem("token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response.data, // chỉ lấy `data` cho gọn
  (error) => {
    console.error("API error:", error.response);
    return Promise.reject(error);
  }
);

export default axiosClient;
