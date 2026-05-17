//
// Ghế đôi = 2 ghế sát nhau, tay vịn chỉ 2 bên ngoài cùng.
//
// Root cause armrest vô giữa:
//   CinemaSeat3D dùng rotation=[0, PI, 0] (xoay 180° Y)
//   → trục X của ghế bị flip: "trái" trong local space = "phải" trong world space
//   → showArmrestLeft/Right phải HOÁN ĐỔI so với tên gọi world-space
//
// Công thức:
//   Ghế TRÁI (position x âm):
//     tay vịn ngoài (world-left)  = local-RIGHT → showArmrestRight=true
//     tay vịn trong (world-right) = local-LEFT  → showArmrestLeft=false
//   Ghế PHẢI (position x dương):
//     tay vịn trong (world-left)  = local-RIGHT → showArmrestRight=false
//     tay vịn ngoài (world-right) = local-LEFT  → showArmrestLeft=true
//
// HALF_GAP: mỗi ghế rộng 0.78 (backGeo), tay vịn ở ±0.44 local
// → sau flip: tay vịn in của ghế trái ở world +0.44-HALF_GAP, ghế phải ở world -(0.44-HALF_GAP)
// HALF_GAP = 0.44 → tay vịn trong chạm nhau đúng tâm

import React from 'react';
import CinemaSeat3D from './CinemaSeat3D';

const HALF_GAP =0.38; // = vị trí tay vịn local (0.44) → 2 tay vịn trong chạm nhau tại x=0

const CoupleSeat3D = ({
  seat,
  partnerSeat,
  position = [0, 0, 0],
  selectedSeats = [],
  onSeatClick,
  onSeatHover,
  viewingSeat,
}) => {
  const isMainSelected   = selectedSeats.some(s => s.seatKey === seat.seatKey);
  const isMainBooked     = seat.status === 'booked' || seat.status === 'locked';
  const isMainViewing    = viewingSeat?.seatKey === seat.seatKey;

  const isPartnerSelected = partnerSeat ? selectedSeats.some(s => s.seatKey === partnerSeat.seatKey) : false;
  const isPartnerBooked   = partnerSeat ? (partnerSeat.status === 'booked' || partnerSeat.status === 'locked') : false;
  const isPartnerViewing  = viewingSeat?.seatKey === partnerSeat?.seatKey;

  const handleClick = () => onSeatClick?.(seat);

  return (
    <group position={position} scale={[1.1, 1, 1.3]}>
      {/*
       * Ghế TRÁI (x = -HALF_GAP)
       * rotation [0, PI, 0] → local X bị flip
       * Tay vịn NGOÀI (world-left):  local-RIGHT → showArmrestRight=true
       * Tay vịn TRONG (world-right): local-LEFT  → showArmrestLeft=false
       */}
      <CinemaSeat3D
        seat={seat}
        position={[-HALF_GAP, 0, 0]}
        rotation={[0, Math.PI, 0]}
        isSelected={isMainSelected}
        isBooked={isMainBooked}
        isViewing={isMainViewing}
        showArmrestLeft={false}
        showArmrestRight={true}
        onSeatClick={handleClick}
        onSeatHover={(s) => onSeatHover?.(s ? seat : null)}
      />

      {/*
       * Ghế PHẢI (x = +HALF_GAP)
       * Tay vịn TRONG (world-left):  local-RIGHT → showArmrestRight=false
       * Tay vịn NGOÀI (world-right): local-LEFT  → showArmrestLeft=true
       */}
      {partnerSeat && (
        <CinemaSeat3D
          seat={partnerSeat}
          position={[HALF_GAP, 0, 0]}
          rotation={[0, Math.PI, 0]}
          isSelected={isPartnerSelected}
          isBooked={isPartnerBooked}
          isViewing={isPartnerViewing}
          showArmrestLeft={true}
          showArmrestRight={false}
          onSeatClick={handleClick}
          onSeatHover={(s) => onSeatHover?.(s ? seat : null)}
        />
      )}
    </group>
  );
};

export default CoupleSeat3D;