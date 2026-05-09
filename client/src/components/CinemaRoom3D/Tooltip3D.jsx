// src/components/CinemaRoom3D/Tooltip3D.jsx
import React from 'react';
import { Html } from '@react-three/drei';

const TYPE_LABEL = {
  standard: 'Thường',
  vip: 'VIP',
  couple: 'Đôi',
};

/**
 * Tooltip hiển thị khi hover vào ghế
 * Dùng Html component của drei để render HTML trong 3D space
 */
const Tooltip3D = ({ seat, showtime }) => {
  if (!seat) return null;

  // Tính giá ghế
  const seatTypePrice = showtime?.seatTypes?.find(st => st.type === seat.type);
  const price = (showtime?.basePrice || 0) + (seatTypePrice?.extraFee || 0);

  const position = seat.position
    ? [seat.position[0], seat.position[1] + 1.2, seat.position[2]]
    : [0, 2, 0];

  return (
    <Html
      position={position}
      center
      distanceFactor={8}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div style={{
        background: 'rgba(10, 10, 20, 0.92)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px',
        padding: '8px 12px',
        color: '#ffffff',
        fontSize: '12px',
        lineHeight: '1.6',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ fontWeight: '700', marginBottom: '2px', fontSize: '13px' }}>
          Ghế: {seat.seatKey}
        </div>
        <div style={{ color: '#94a3b8' }}>
          Loại: <span style={{ color: '#e2e8f0' }}>{TYPE_LABEL[seat.type] || seat.type}</span>
        </div>
        <div style={{ color: '#94a3b8' }}>
          Giá: <span style={{ color: '#fbbf24', fontWeight: '600' }}>
            {price.toLocaleString('vi-VN')}đ
          </span>
        </div>
        {(seat.status === 'booked' || seat.status === 'locked') && (
          <div style={{ color: '#ef4444', marginTop: '2px', fontSize: '11px' }}>
            ✗ Đã có người đặt
          </div>
        )}
      </div>
    </Html>
  );
};

export default Tooltip3D;