import React, { useState, useEffect } from 'react';
import { Space, Tag, message, Button } from 'antd';
import { VideoCameraOutlined, AppstoreOutlined } from '@ant-design/icons';

// Lazy import CinemaRoom3D để không load R3F khi không cần
const CinemaRoom3D = React.lazy(() => import('../CinemaRoom3D'));

const SeatSelection = ({ showtime, selectedSeats, onSelect }) => {
  const [viewMode, setViewMode] = useState('2d'); // '2d' | '3d'
  const [webGLSupported, setWebGLSupported] = useState(true);

  // Kiểm tra WebGL support một lần khi mount
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebGLSupported(false);
    } catch (e) {
      setWebGLSupported(false);
    }
  }, []);

  // ==========================================
  // Logic xử lý chọn ghế (dùng cho cả 2D và 3D)
  // ==========================================
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

        const seatTypePrice = showtime.seatTypes.find(st => st.type === 'couple');
        const totalCouplePrice = showtime.basePrice + (seatTypePrice?.extraFee || 0);
        const pricePerSeatInCouple = totalCouplePrice / 2;

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

  // ==========================================
  // Render sơ đồ 2D (code gốc)
  // ==========================================
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

  // ==========================================
  // Render 3D mode
  // ==========================================
  const render3DLayout = () => {
    return (
      <React.Suspense fallback={
        <div style={{
          height: 480,
          background: '#0a0a14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 14,
          borderRadius: 12,
        }}>
          🎬 Đang tải phòng chiếu 3D...
        </div>
      }>
        <CinemaRoom3D
          showtime={showtime}
          selectedSeats={selectedSeats}
          onSelect={onSelect}
        />
      </React.Suspense>
    );
  };

  return (
    <div className="seat-selection-container">

      {/* === TOGGLE 2D / 3D === */}
      <div className="view-mode-toggle" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
      }}>
        <Button
          type={viewMode === '2d' ? 'primary' : 'default'}
          icon={<AppstoreOutlined />}
          onClick={() => setViewMode('2d')}
        >
          Sơ đồ 2D
        </Button>
        <Button
          type={viewMode === '3d' ? 'primary' : 'default'}
          icon={<VideoCameraOutlined />}
          onClick={() => setViewMode('3d')}
          disabled={!webGLSupported}
          title={!webGLSupported ? 'Trình duyệt không hỗ trợ 3D' : ''}
          style={viewMode === '3d' ? { background: '#1e3a5f', borderColor: '#3b82f6', color: '#fff' } : {}}
        >
          Chế độ 3D
          {!webGLSupported && ' (Không hỗ trợ)'}
        </Button>
      </div>

      {/* === NỘI DUNG === */}
      {viewMode === '2d' ? (
        <>
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
        </>
      ) : (
        render3DLayout()
      )}

    </div>
  );
};

export default SeatSelection;