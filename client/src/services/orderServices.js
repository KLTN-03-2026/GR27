// src/services/orderServices.js
import { get, patch, post } from "../utils";
import { API_ENDPOINTS } from "../constants";
/**
 * Tạo đơn hàng mới
 * @param {object} orderData - Dữ liệu đơn hàng bao gồm { showtimeId, seats, comboFoods }
 */
export const createOrder = (orderData) => post(API_ENDPOINTS.ORDERS.CREATE, orderData);

/**
 * Kiểm tra trạng thái thanh toán của đơn hàng (dùng để polling)
 * @param {string} orderId - ID của đơn hàng
 */
export const checkPaymentStatus = (orderId) => 
  get(`${API_ENDPOINTS.ORDERS.DETAIL(orderId)}/check-payment`);

/**
 * Lấy thông tin chi tiết của một đơn hàng (để hiển thị vé)
 * @param {string} orderId - ID của đơn hàng
 */
export const getOrderDetail = (orderId) => 
  get(API_ENDPOINTS.ORDERS.DETAIL(orderId));

/**
 * Hủy đơn hàng
 */
export const cancelOrder = (orderId) => 
  patch(`${API_ENDPOINTS.ORDERS.DETAIL(orderId)}/cancel`);

/**
 * Lấy lịch sử đặt vé của người dùng (có phân trang và bộ lọc)
 * @param {object} params - Các tham số truy vấn { page, limit, orderStatus }
 */
export const getMyOrders = (params) => {
  const query = new URLSearchParams(params).toString();
  return get(`${API_ENDPOINTS.ORDERS.MY_ORDERS}?${query}`);
};

// ============== ADMIN APIs ==============

/**
 * [ADMIN] Lấy tất cả đơn hàng với filter và phân trang
 * @param {object} params - { page, limit, search, orderStatus, paymentStatus, startDate, endDate, filmId, cinemaId }
 */
export const getAllOrdersAdmin = (params) => {
  const query = new URLSearchParams(params).toString();
  return get(`${API_ENDPOINTS.ORDERS.ADMIN_LIST}?${query}`);
};

/**
 * [ADMIN] Lấy chi tiết đơn hàng
 */
export const getOrderDetailAdmin = (orderId) => 
  get(API_ENDPOINTS.ORDERS.ADMIN_DETAIL(orderId));