// src/components/CinemaRoom3D/SeatsLayer.jsx
import React from 'react';
import CinemaSeat3D from './CinemaSeat3D';
import CoupleSeat3D from './CoupleSeat3D';

/**
 * Render toàn bộ ghế trong phòng từ processedSeats
 *
 * - Ghế thường/VIP → CinemaSeat3D
 * - Ghế đôi → CoupleSeat3D (render 2 ghế mirror)
 * - Ghế partner (partnerKey) → bỏ qua, đã render trong CoupleSeat3D
 */
const SeatsLayer = ({
  processedSeats = [],
  partnerKeys,
  selectedSeats = [],
  onSeatClick,
  onSeatHover,
  viewingSeat,
  showtime,
}) => {
  // Map seatKey → seat object để lookup nhanh partner
  const seatMap = React.useMemo(() => {
    const map = {};
    processedSeats.forEach(s => { map[s.seatKey] = s; });
    return map;
  }, [processedSeats]);

  // Chỉ render ghế không phải partner
  const renderableSeats = React.useMemo(() => {
    return processedSeats.filter(s => !partnerKeys.has(s.seatKey));
  }, [processedSeats, partnerKeys]);

  return (
    <group>
      {renderableSeats.map(seat => {
        const isBooked = seat.status === 'booked' || seat.status === 'locked';
        const isSelected = selectedSeats.some(s => s.seatKey === seat.seatKey);
        const isViewing = viewingSeat?.seatKey === seat.seatKey;

        if (seat.type === 'couple') {
          // Tìm partner seat (nếu có) để biết status
          const partnerSeat = seat.partnerSeatKey ? seatMap[seat.partnerSeatKey] : null;

          return (
            <CoupleSeat3D
              key={seat.seatKey}
              seat={seat}
              partnerSeat={partnerSeat}
              position={seat.position}
              selectedSeats={selectedSeats}
              onSeatClick={onSeatClick}
              onSeatHover={onSeatHover}
              viewingSeat={viewingSeat}
            />
          );
        }

        return (
          <CinemaSeat3D
            key={seat.seatKey}
            seat={seat}
            position={seat.position}
            rotation={[0, Math.PI, 0]} // Ghế nhìn về phía màn hình (z âm)
            isSelected={isSelected}
            isBooked={isBooked}
            isViewing={isViewing}
            onSeatClick={onSeatClick}
            onSeatHover={onSeatHover}
          />
        );
      })}
    </group>
  );
};

export default SeatsLayer;