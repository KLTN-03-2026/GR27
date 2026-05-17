import React from 'react';
import { Typography, Divider, Card } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Confirmation = ({ film, showtime, selectedSeats, selectedCombos, totalPrice, user }) => {
  return (
    <div className="confirmation-summary">
      <Title level={4}>Xác nhận thông tin đặt vé</Title>
      
      <Card>
        <div className="summary-item">
          <Text className="item-label">Phim</Text>
          <Text className="item-value">{film?.title}</Text>
        </div>
        <div className="summary-item">
          <Text className="item-label">Rạp</Text>
          <Text className="item-value">{showtime?.cinemaId?.name}</Text>
        </div>
        <div className="summary-item">
          <Text className="item-label">Suất chiếu</Text>
          <Text className="item-value">
            {dayjs(showtime?.startTime).format('HH:mm - DD/MM/YYYY')}
          </Text>
        </div>
        <div className="summary-item">
          <Text className="item-label">Ghế đã chọn</Text>
          <Text className="item-value">
            {selectedSeats.map(s => s.seatKey).join(', ')} ({selectedSeats.length} ghế)
          </Text>
        </div>
        {selectedCombos.length > 0 && (
          <div className="summary-item">
            <Text className="item-label">Combo</Text>
            <div className="item-value">
              {selectedCombos.map(c => (
                <div key={c.comboFoodId}>{c.name} (x{c.quantity})</div>
              ))}
            </div>
          </div>
        )}
      </Card>
      
      <Card style={{ marginTop: 16 }}>
        <div className="summary-item">
          <Text className="item-label">Khách hàng</Text>
          <Text className="item-value">{user?.fullname ? user.fullname : user?.username}</Text>
        </div>
        <div className="summary-item">
          <Text className="item-label">Email</Text>
          <Text className="item-value">{user?.email}</Text>
        </div>
      </Card>

      <Divider />
      
      <div className="summary-item" style={{ border: 'none' }}>
        <Title level={5}>Tổng tiền</Title>
        <Title level={4} style={{ color: '#e50914', margin: 0 }}>
          {totalPrice.toLocaleString('vi-VN')} đ
        </Title>
      </div>
    </div>
  );
};

export default Confirmation;