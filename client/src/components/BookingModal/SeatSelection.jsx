// src/components/BookingModal/SeatSelection.jsx
import React from 'react';
import { Space, Tag, message } from 'antd';

const SeatSelection = ({ showtime, selectedSeats, onSelect }) => {

  const countSelections = (seats) => {
    const counted = new Set();
    let count = 0;
    seats.forEach(seat => {
      if (counted.has(seat.seatKey)) return;
      
      count++;
      
      if (seat.type === 'couple' && seat.partnerSeatKey) {
        counted.add(seat.seatKey);
        counted.add(seat.partnerSeatKey);
      } else {
        counted.add(seat.seatKey);
      }
    });
    return count;
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'booked' || seat.status === 'locked') {
      message.warning('Ghế này đã có người chọn.');
      return;
    }

    const isSelected = selectedSeats.some(s => s.seatKey === seat.seatKey);
    let newSelectedSeats = [...selectedSeats];

    if (isSelected) {
      newSelectedSeats = newSelectedSeats.filter(s => s.seatKey !== seat.seatKey);
      if (seat.type === 'couple' && seat.partnerSeatKey) {
        newSelectedSeats = newSelectedSeats.filter(s => s.seatKey !== seat.partnerSeatKey);
      }
    } else {
      if (seat.type === 'couple') {
        if (countSelections(newSelectedSeats) + 1 > 6) {
          message.warning('Bạn chỉ được chọn tối đa 6 ghế.');
          return;
        }

        const partnerSeat = showtime.seats.find(s => s.seatKey === seat.partnerSeatKey);
        if (partnerSeat && (partnerSeat.status === 'booked' || partnerSeat.status === 'locked')) {
           message.warning('Không thể chọn ghế đôi này vì ghế đi kèm đã có người chọn.');
           return;
        }

        // *** SỬA LỖI TÍNH GIÁ GHẾ ĐÔI ***
        // Giá của một cặp ghế đôi = giá vé cơ bản + phụ phí ghế đôi.
        // Sau đó chia đôi cho mỗi ghế vật lý.
        const seatTypePrice = showtime.seatTypes.find(st => st.type === 'couple');
        const totalCouplePrice = showtime.basePrice + (seatTypePrice?.extraFee || 0);
        const pricePerSeatInCouple = totalCouplePrice / 2; // Chia đôi giá cho mỗi ghế

        const seatWithPrice = { ...seat, price: pricePerSeatInCouple };
        newSelectedSeats.push(seatWithPrice);

        if (partnerSeat) {
          const partnerWithPrice = { ...partnerSeat, price: pricePerSeatInCouple };
          newSelectedSeats.push(partnerWithPrice);
        }

      } else {
        if (countSelections(newSelectedSeats) + 1 > 6) {
          message.warning('Bạn chỉ được chọn tối đa 6 ghế.');
          return;
        }
        
        const seatTypePrice = showtime.seatTypes.find(st => st.type === seat.type);
        const price = showtime.basePrice + (seatTypePrice?.extraFee || 0);
        const seatWithPrice = { ...seat, price };
        newSelectedSeats.push(seatWithPrice);
      }
    }
    onSelect(newSelectedSeats);
  };

  const renderSeatLayout = () => {
    if (!showtime?.seats || showtime.seats.length === 0) return null;
    
    const maxCol = Math.max(...showtime.seats.map(s => s.number), 0);
    
    const seatMatrix = {};
    showtime.seats.forEach(seat => {
      const key = `${seat.row}-${seat.number}`;
      seatMatrix[key] = seat;
    });

    const sortedRows = [...new Set(showtime.seats.map(s => s.row))].sort();

    return (
      <div className="seat-grid">
        {/* Hàng ghế */}
        {sortedRows.map(row => (
          <div key={row} className="seat-row">
            <div className="row-label">{row}</div>
            {Array.from({ length: maxCol }, (_, colIndex) => {
              const col = colIndex + 1;
              const key = `${row}-${col}`;
              const seat = seatMatrix[key];

              if (!seat) {
                return <div key={key} className="seat" style={{ visibility: 'hidden' }} />;
              }

              const isSelected = selectedSeats.some(s => s.seatKey === seat.seatKey);
              let seatClass = `seat ${seat.type} ${seat.status}`;
              if (isSelected) seatClass += ' selected';

              return (
                <div key={seat.seatKey} className={seatClass} onClick={() => handleSeatClick(seat)}>
                  {/* SỬA LỖI HIỂN THỊ SEATKEY */}
                  {seat.seatKey}
                </div>
              );
            })}
             <div className="row-label">{row}</div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="seat-selection-container">
      <div className="screen"></div>
      
      {renderSeatLayout()}

      <div className="seat-legend">
        <Space wrap>
          <Tag color="blue">Standard</Tag>
          <Tag color="gold">VIP</Tag>
          <Tag color="magenta">Couple</Tag>
          <Tag color="#52c41a">Đang chọn</Tag>
          <Tag color="#bfbfbf">Đã bán/Khóa</Tag>
        </Space>
      </div>
    </div>
  );
};

export default SeatSelection;