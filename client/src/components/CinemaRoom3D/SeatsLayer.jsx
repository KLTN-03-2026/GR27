// src/components/CinemaRoom3D/SeatsLayer.jsx
//
// Tối ưu: bọc CinemaSeat3D và CoupleSeat3D bằng React.memo
// → chỉ re-render ghế khi đúng ghế đó thay đổi trạng thái
// → tránh toàn bộ 100+ ghế re-render khi hover/click 1 ghế

import React from 'react';
import CinemaSeat3D from './CinemaSeat3D';
import CoupleSeat3D from './CoupleSeat3D';

// -------------------------------------------------------
// Memo wrapper cho ghế thường/VIP
// So sánh đúng các prop ảnh hưởng visual → skip re-render nếu không đổi
// -------------------------------------------------------
const MemoSeat = React.memo(
  ({ seat, isSelected, isBooked, isViewing, onSeatClick, onSeatHover }) => (
    <CinemaSeat3D
      seat={seat}
      position={seat.position}
      rotation={[0, Math.PI, 0]}
      isSelected={isSelected}
      isBooked={isBooked}
      isViewing={isViewing}
      onSeatClick={onSeatClick}
      onSeatHover={onSeatHover}
    />
  ),
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.isBooked   === next.isBooked   &&
    prev.isViewing  === next.isViewing  &&
    prev.seat.seatKey === next.seat.seatKey
);

// -------------------------------------------------------
// Memo wrapper cho ghế đôi
// -------------------------------------------------------
const MemoCoupleSeat = React.memo(
  ({ seat, partnerSeat, selectedSeats, onSeatClick, onSeatHover, viewingSeat }) => (
    <CoupleSeat3D
      seat={seat}
      partnerSeat={partnerSeat}
      position={seat.position}
      selectedSeats={selectedSeats}
      onSeatClick={onSeatClick}
      onSeatHover={onSeatHover}
      viewingSeat={viewingSeat}
    />
  ),
  (prev, next) => {
    const mainSame    = prev.seat.seatKey === next.seat.seatKey;
    const selectedSame = prev.selectedSeats === next.selectedSeats;
    const viewingSame  = prev.viewingSeat?.seatKey === next.viewingSeat?.seatKey;
    return mainSame && selectedSame && viewingSame;
  }
);

// -------------------------------------------------------
// SeatsLayer
// -------------------------------------------------------
const SeatsLayer = ({
  processedSeats = [],
  partnerKeys,
  selectedSeats = [],
  onSeatClick,
  onSeatHover,
  viewingSeat,
  showtime,
}) => {
  const seatMap = React.useMemo(() => {
    const map = {};
    processedSeats.forEach(s => { map[s.seatKey] = s; });
    return map;
  }, [processedSeats]);

  const renderableSeats = React.useMemo(
    () => processedSeats.filter(s => !partnerKeys.has(s.seatKey)),
    [processedSeats, partnerKeys]
  );

  // Set seatKey đang selected để so sánh nhanh O(1) thay vì Array.some O(n)
  const selectedSet = React.useMemo(
    () => new Set(selectedSeats.map(s => s.seatKey)),
    [selectedSeats]
  );

  return (
    <group>
      {renderableSeats.map(seat => {
        const isBooked   = seat.status === 'booked' || seat.status === 'locked';
        const isSelected = selectedSet.has(seat.seatKey);
        const isViewing  = viewingSeat?.seatKey === seat.seatKey;

        if (seat.type === 'couple') {
          const partnerSeat = seat.partnerSeatKey ? seatMap[seat.partnerSeatKey] : null;
          return (
            <MemoCoupleSeat
              key={seat.seatKey}
              seat={seat}
              partnerSeat={partnerSeat}
              selectedSeats={selectedSeats}
              onSeatClick={onSeatClick}
              onSeatHover={onSeatHover}
              viewingSeat={viewingSeat}
            />
          );
        }

        return (
          <MemoSeat
            key={seat.seatKey}
            seat={seat}
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