// src/context/BookingContext.jsx

import React, { createContext, useState, useContext, useCallback } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getShowTimeById } from '../services/showTimeServices';
import BookingModal from '../components/BookingModal';

// 1. Tạo Context
const BookingContext = createContext();

// 2. Tạo Provider Component
export const BookingProvider = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [messageApi, contextHolder] = message.useMessage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  console.log('isLoading', isLoading);
  // Hàm này sẽ được gọi từ bất kỳ component nào
  const openBookingModal = useCallback(async (showtimeStub) => {
    if (!isAuthenticated) {
      messageApi.warning("Vui lòng đăng nhập để đặt vé!");
      navigate("/auth/login");
      return;
    }

    setIsLoading(true);
    const key = 'loadingShowtimeDetails';
    messageApi.open({ key, type: 'loading', content: 'Đang tải thông tin suất chiếu...' });

    try {
      // Luôn gọi API để lấy dữ liệu suất chiếu đầy đủ nhất
      const result = await getShowTimeById(showtimeStub._id);
      
      if (result.code === 200) {
        setSelectedShowtime(result.data);
        setIsModalOpen(true);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      messageApi.error(err.message || "Không thể tải chi tiết suất chiếu.");
    } finally {
      setIsLoading(false);
      messageApi.destroy(key);
    }
  }, [isAuthenticated, navigate, messageApi]);

  const closeBookingModal = () => {
    setIsModalOpen(false);
    setSelectedShowtime(null);
  };

  const value = { openBookingModal };

  return (
    <BookingContext.Provider value={value}>
      {contextHolder}
      {children}
      
      {/* BookingModal giờ sẽ được quản lý bởi Provider */}
      {selectedShowtime && (
        <BookingModal
          showtime={selectedShowtime}
          open={isModalOpen}
          onClose={closeBookingModal}
        />
      )}
    </BookingContext.Provider>
  );
};

// 3. Tạo custom hook để dễ dàng sử dụng
export const useBooking = () => {
  return useContext(BookingContext);
};