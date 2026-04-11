export const FILM_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  COMING_SOON: 'coming_soon'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Dùng lúc order đặt ghế
export const  SHOWTIME_SEAT_STATUS = {
  AVAILABLE: "available", // Ghế trống
  BOOKED: "booked",       // Ghế đã được đặt
  LOCKED: "locked",       // Ghế đang trong quá trình giao dịch
}