export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REGISTER: "/auth/register",
    REGISTER_CHECK_EMAIL: "/auth/register/check-email",
    REGISTER_CANCEL: "/auth/register/cancel-register",
    RESEND_OTP: "/auth/resendOtp",
    FORGOT_PASSWORD: "/auth/password/forgot",
    CHECK_OTP: "/auth/password/otp",
    RESET_PASSWORD: "/auth/password/reset",
    ME: "/auth/me",
    REFRESH: "/auth/refresh",
  },

  // Films
  FILMS: {
    LIST: "/films",
    CREATE: "/films",
    DETAIL_BY_ID: (id) => `/films/${id}`, // Admin: GET by ID
    DETAIL_BY_SLUG: (slug) => `/films/slug/${slug}`, // Public: GET by slug
    UPDATE: (id) => `/films/${id}`, // Admin: PATCH
    DELETE: (id) => `/films/${id}`, // Admin: DELETE
    UPLOAD_POSTER: (id) => `/films/${id}/poster`,
  },

  // Category
  CATEGORIES: {
    LIST: "/categories",
    CREATE: "/categories",
    DETAIL: (id) => `/categories/${id}`,
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },

  // Cinemas
  CINEMAS: {
    LIST: "/cinemas",
    CREATE: "/cinemas",
    DETAIL_BY_ID: (id) => `/cinemas/${id}`, // Admin: GET by ID
    DETAIL_BY_SLUG: (slug) => `/cinemas/slug/${slug}`, // Public: GET by slug
    UPDATE: (id) => `/cinemas/${id}`,
    DELETE: (id) => `/cinemas/${id}`,
    ROOMS: (id) => `/cinemas/${id}/rooms`,
  },

  // Rooms
  ROOMS: {
    LIST: "/rooms",
    CREATE: "/rooms",
    DETAIL: (id) => `/rooms/${id}`,
    UPDATE: (id) => `/rooms/${id}`,
    DELETE: (id) => `/rooms/${id}`,
  },

  // Show Times
  SHOW_TIMES: {
    LIST: "/show-times",
    CREATE: "/show-times",
    DETAIL_BY_ID: (id) => `/show-times/${id}`,
    DETAIL_BY_SLUG: (slug) => `/show-times/slug/${slug}`,
    UPDATE: (id) => `/show-times/${id}`,
    DELETE: (id) => `/show-times/${id}`,
    BY_CINEMA: (cinemaId) => `/show-times/cinema/${cinemaId}`,
    BY_FILM: (filmId) => `/show-times/film/${filmId}`,
  },

  // Users
  USERS: {
    LIST: "/users",
    CREATE: "/users",
    DETAIL: (id) => `/users/${id}`,
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    UPDATE_PROFILE: "/users/me",
    CHANGE_PASSWORD: "/users/me/change-password",
    UPDATE_ROLE: (id) => `/users/${id}/role`,
    UPDATE_STATUS: (id) => `/users/${id}/status`,
  },

  // Comments
  COMMENTS: {
    LIST: "/comments",
    CREATE: "/comments",
    DETAIL: (id) => `/comments/${id}`,
    UPDATE: (id) => `/comments/${id}`,
    DELETE: (id) => `/comments/${id}`,
    REPORT: (id) => `/comments/${id}/report`,
    UNREPORT: (id) => `/comments/${id}/unreport`,
    BY_FILM: (filmId) => `/comments/film/${filmId}`,
  },

  // Promotions
  PROMOTIONS: {
    LIST: "/promotions",
    CREATE: "/promotions",
    DETAIL: (id) => `/promotions/${id}`,
    UPDATE: (id) => `/promotions/${id}`,
    DELETE: (id) => `/promotions/${id}`,
  },

  // Orders
  ORDERS: {
    LIST: "/orders",
    CREATE: "/orders",
    DETAIL: (id) => `/orders/${id}`,
    UPDATE: (id) => `/orders/${id}`,
    DELETE: (id) => `/orders/${id}`,
    MY_ORDERS: "/orders/me",
    ADMIN_LIST: "/orders/admin", 
    ADMIN_DETAIL: (id) => `/orders/admin/${id}`, 
  },

  // Upload
  UPLOAD: {
    IMAGE: "/upload/image",
    VIDEO: "/upload/video",
  },
  CITIES: {
    LIST: "/cities",
    CREATE: "/cities",
    DETAIL: (id) => `/cities/${id}`,
    UPDATE: (id) => `/cities/${id}`,
    DELETE: (id) => `/cities/${id}`,
  },

  DASHBOARD: {
    OVERVIEW: "/dashboard/overview",
    REVENUE_CHART: "/dashboard/revenue-chart",
    TOP_FILMS: "/dashboard/top-films",
    REVENUE_BY_CINEMA: "/dashboard/revenue-by-cinema",
    USER_GROWTH: "/dashboard/user-growth",
    COMMENT_STATS: "/dashboard/comment-stats",
    SEAT_TYPE_STATS: "/dashboard/seat-type-stats",
    FORMAT_STATS: "/dashboard/format-stats",
  },
};
