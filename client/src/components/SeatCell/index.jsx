const SeatCell = ({ row, col, seat, onClick }) => {
  // Xác định style dựa trên loại ghế
  const getSeatStyle = () => {
    const baseStyle = {
      width: '30px',
      height: '30px',
      margin: '1px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '10px',
      fontWeight: 'bold',
      transition: 'all 0.2s ease',
      userSelect: 'none'
    };

    if (!seat) {
      // Ô trống
      return {
        ...baseStyle,
        backgroundColor: '#f5f5f5',
        color: '#ccc',
        borderColor: '#e0e0e0'
      };
    }

    // Có ghế - màu sắc theo loại
    switch (seat.type) {
      case 'standard':
        return {
          ...baseStyle,
          backgroundColor: '#1890ff',
          color: 'white',
          borderColor: '#0050b3'
        };
      case 'vip':
        return {
          ...baseStyle,
          backgroundColor: '#faad14',
          color: 'white',
          borderColor: '#d48806'
        };
      case 'couple':
        return {
          ...baseStyle,
          backgroundColor: '#eb2f96',
          color: 'white',
          borderColor: '#c41d7f'
        };
      default:
        return baseStyle;
    }
  };

  // Xác định nội dung hiển thị trong ô
  const getSeatContent = () => {
    if (!seat) {
      return ''; // Ô trống không hiển thị gì
    }

    // Hiển thị seatKey thay vì vị trí vật lý
    return seat.seatKey;
  };

  // Xác định title tooltip
  const getSeatTitle = () => {
    if (!seat) {
      return `Nhấn để tạo ghế tại vị trí ${row}${col}`;
    }

    let title = `Ghế ${seat.seatKey} (vị trí ${row}${col}) - ${seat.type.toUpperCase()}`;
    
    if (seat.type === 'couple' && seat.partnerSeatKey) {
      title += ` (đôi với ${seat.partnerSeatKey})`;
    }
    
    title += '\nNhấn để xóa';
    
    return title;
  };

  const handleClick = () => {
    onClick(row, col);
  };

  const handleMouseEnter = (e) => {
    if (seat) {
      e.target.style.transform = 'scale(1.1)';
      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    } else {
      e.target.style.backgroundColor = '#e6f7ff';
      e.target.style.borderColor = '#1890ff';
    }
  };

  const handleMouseLeave = (e) => {
    e.target.style.transform = 'scale(1)';
    e.target.style.boxShadow = 'none';
    
    if (!seat) {
      e.target.style.backgroundColor = '#f5f5f5';
      e.target.style.borderColor = '#e0e0e0';
    }
  };

  return (
    <div
      style={getSeatStyle()}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={getSeatTitle()}
    >
      {getSeatContent()}
    </div>
  );
};

export default SeatCell;