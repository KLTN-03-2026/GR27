// src/components/CinemaRoom3D/CoupleSeat3D.jsx
//
// Ghế đôi = 2 ghế sát nhau, không có tay vịn ở giữa
// Ghế trái: showArmrestRight=false
// Ghế phải: showArmrestLeft=false (xoay 180° để mặt ghế cùng hướng)

import React from 'react';
import CinemaSeat3D from './CinemaSeat3D';

// Khoảng cách mỗi ghế tính từ tâm cặp đôi
// Nhỏ hơn SEAT_WIDTH để 2 ghế sát nhau hơn ghế thường
const HALF_GAP = 0.45;

const CoupleSeat3D = ({
  seat,
  partnerSeat,
  position = [0, 0, 0],
  selectedSeats = [],
  onSeatClick,
  onSeatHover,
  viewingSeat,
}) => {
  const isMainSelected    = selectedSeats.some(s => s.seatKey === seat.seatKey);
  const isMainBooked      = seat.status === 'booked' || seat.status === 'locked';
  const isMainViewing     = viewingSeat?.seatKey === seat.seatKey;

  const isPartnerSelected = partnerSeat ? selectedSeats.some(s => s.seatKey === partnerSeat.seatKey) : false;
  const isPartnerBooked   = partnerSeat ? (partnerSeat.status === 'booked' || partnerSeat.status === 'locked') : false;
  const isPartnerViewing  = viewingSeat?.seatKey === partnerSeat?.seatKey;

  const handleClick = () => onSeatClick?.(seat);

  return (
    <group position={position}>
      {/*
       * Ghế TRÁI (ghế chính)
       * - Mặt ghế quay về phía màn hình: rotation [0, Math.PI, 0]
       * - Không có tay vịn bên phải (phía trong)
       */}
      <CinemaSeat3D
        seat={seat}
        position={[-HALF_GAP, 0, 0]}
        rotation={[0, Math.PI, 0]}
        isSelected={isMainSelected}
        isBooked={isMainBooked}
        isViewing={isMainViewing}
        showArmrestLeft={true}
        showArmrestRight={false}
        onSeatClick={handleClick}
        onSeatHover={(s) => onSeatHover?.(s ? seat : null)}
      />

      {/*
       * Ghế PHẢI (partner)
       * - Cùng hướng với ghế trái: rotation [0, Math.PI, 0]
       * - Không có tay vịn bên trái (phía trong)
       */}
      {partnerSeat && (
        <CinemaSeat3D
          seat={partnerSeat}
          position={[HALF_GAP, 0, 0]}
          rotation={[0, Math.PI, 0]}
          isSelected={isPartnerSelected}
          isBooked={isPartnerBooked}
          isViewing={isPartnerViewing}
          showArmrestLeft={false}
          showArmrestRight={true}
          onSeatClick={handleClick}
          onSeatHover={(s) => onSeatHover?.(s ? seat : null)}
        />
      )}
    </group>
  );
};

export default CoupleSeat3D;