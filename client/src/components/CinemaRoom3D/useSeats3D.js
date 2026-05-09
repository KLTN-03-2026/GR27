// src/components/CinemaRoom3D/useSeats3D.js
import { useMemo } from 'react';

export const SEAT_WIDTH    = 1.05;  // khoảng cách ngang ghế thường/VIP
export const COUPLE_WIDTH  = 1.0;   // khoảng cách ngang ghế đôi (tính theo cặp, không phải đơn)
export const ROW_DEPTH     = 1.6;   // khoảng cách hàng
export const ROW_ELEVATION = 0.28;  // độ dốc mỗi hàng
export const SEAT_HEIGHT   = 0.1;

const useSeats3D = (seats = []) => {
  return useMemo(() => {
    if (!seats || seats.length === 0) {
      return {
        processedSeats: [],
        partnerKeys: new Set(),
        allRows: [],
        maxNumber: 0,
        roomDimensions: { width: 10, depth: 10, height: 6 },
      };
    }

    const allRows   = [...new Set(seats.map(s => s.row))].sort();
    const totalRows = allRows.length;
    const maxNumber = Math.max(...seats.map(s => s.number));

    const roomWidth  = maxNumber * SEAT_WIDTH + 6;
    const roomDepth  = totalRows * ROW_DEPTH + 6;
    const roomHeight = Math.max(6, totalRows * ROW_ELEVATION + 5);

    // -------------------------------------------------------
    // Build partnerKeys: ghế có number lớn hơn trong cặp = partner → skip khi render
    // -------------------------------------------------------
    const partnerKeys = new Set();
    const seen = new Set();

    seats.forEach(seat => {
      if (seat.type !== 'couple' || !seat.partnerSeatKey) return;
      if (seen.has(seat.seatKey)) return;

      const partner = seats.find(s => s.seatKey === seat.partnerSeatKey);
      if (!partner) return;

      seen.add(seat.seatKey);
      seen.add(partner.seatKey);

      // Ghế number lớn hơn = partner, bị skip
      if (seat.number < partner.number) {
        partnerKeys.add(partner.seatKey);
      } else {
        partnerKeys.add(seat.seatKey);
      }
    });

    // Tính toạ độ 3D
    const processedSeats = seats.map(seat => {
      const rowIndex = allRows.indexOf(seat.row);
      const x = (seat.number - 1) * SEAT_WIDTH - ((maxNumber - 1) / 2) * SEAT_WIDTH;
      const y = rowIndex * ROW_ELEVATION + SEAT_HEIGHT;
      const z = -((totalRows - 1 - rowIndex) * ROW_DEPTH) + (totalRows * ROW_DEPTH) / 2 - 2;

      return {
        ...seat,
        position: [x, y, z],
        rowIndex,
        isPartner: partnerKeys.has(seat.seatKey),
      };
    });

    return {
      processedSeats,
      partnerKeys,
      allRows,
      maxNumber,
      roomDimensions: { width: roomWidth, depth: roomDepth, height: roomHeight },
    };
  }, [seats]);
};

export default useSeats3D;