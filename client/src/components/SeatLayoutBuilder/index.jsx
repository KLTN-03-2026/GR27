import { useState, useEffect } from "react";
import { Card, Radio, Button, Row, Col, Typography, Space, Tag, message, Select } from "antd";
import { ClearOutlined } from "@ant-design/icons";
import SeatCell from "../SeatCell";

const { Title, Text } = Typography;
const { Option } = Select;

const SeatLayoutBuilder = ({ onChange, value = [] }) => {
  const [selectedSeatType, setSelectedSeatType] = useState("standard");
  const [coupleDirection, setCoupleDirection] = useState("right"); // "right" hoặc "left"
  const [seatMatrix, setSeatMatrix] = useState({});
  const [seatOrder, setSeatOrder] = useState([]); // Mảng lưu thứ tự chọn ghế
  const [messageApi, contextHolder] = message.useMessage();

  // Ma trận ghế: A-L (12 hàng), 1-20 (20 cột)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const maxColumns = 20;

  // Khởi tạo matrix từ value props
  useEffect(() => {
    if (value && value.length > 0) {
      const matrix = {};
      const orderArray = [];
      
      value.forEach(seat => {
        const key = `${seat.row}-${seat.number}`;
        matrix[key] = {
          type: seat.type,
          partnerSeatKey: seat.partnerSeatKey || null,
          seatKey: seat.seatKey
        };
        
        // Xây dựng lại thứ tự từ seatKey
        orderArray.push({
          key,
          seatKey: seat.seatKey,
          row: seat.row,
          type: seat.type
        });
      });

      // Sắp xếp theo seatKey để có đúng thứ tự
      orderArray.sort((a, b) => {
        const aNum = parseInt(a.seatKey.substring(1));
        const bNum = parseInt(b.seatKey.substring(1));
        return aNum - bNum;
      });

      setSeatMatrix(matrix);
      setSeatOrder(orderArray);
    }
  }, [value]);

  // Tạo seatKey dựa trên thứ tự chọn
  const generateSeatKey = (row, existingOrder = seatOrder) => {
    // Đếm số ghế đã có trong hàng này
    const seatsInRow = existingOrder.filter(item => item.row === row);
    const nextNumber = seatsInRow.length + 1;
    return `${row}${nextNumber}`;
  };

  // Cập nhật thứ tự và matrix
  const updateSeatLayout = (newMatrix, newOrder) => {
    setSeatMatrix(newMatrix);
    setSeatOrder(newOrder);
    
    const seatLayout = [];

    // Duyệt theo thứ tự đã được sắp xếp
    newOrder.forEach(orderItem => {
      const seat = newMatrix[orderItem.key];
      if (seat) {
        const [row, colStr] = orderItem.key.split('-');
        const col = parseInt(colStr);
        
        const seatData = {
          row: row,
          number: col,
          type: seat.type,
          seatKey: seat.seatKey
        };

        // Thêm partnerSeatKey nếu là ghế couple
        if (seat.type === 'couple' && seat.partnerSeatKey) {
          seatData.partnerSeatKey = seat.partnerSeatKey;
        }

        seatLayout.push(seatData);
      }
    });

    onChange(seatLayout);
  };

  // Xử lý click vào ô ghế
  const handleSeatClick = (row, col) => {
    const key = `${row}-${col}`;
    const newMatrix = { ...seatMatrix };
    let newOrder = [...seatOrder];

    // Nếu ô đã có ghế, xóa ghế đó
    if (newMatrix[key]) {
      const seatToRemove = newMatrix[key];
      
      // Nếu là ghế couple, cần xóa cả partner
      if (seatToRemove.type === 'couple' && seatToRemove.partnerSeatKey) {
        // Tìm partner seat để xóa
        Object.keys(newMatrix).forEach(partnerKey => {
          const partnerSeat = newMatrix[partnerKey];
          if (partnerSeat && partnerSeat.partnerSeatKey === seatToRemove.seatKey) {
            delete newMatrix[partnerKey];
            // Xóa khỏi order
            newOrder = newOrder.filter(item => item.key !== partnerKey);
          }
        });
      }
      
      delete newMatrix[key];
      // Xóa khỏi order
      newOrder = newOrder.filter(item => item.key !== key);
      
      // Cập nhật lại seatKey cho các ghế còn lại trong cùng hàng
      const remainingSeatsInRow = newOrder.filter(item => item.row === row);
      remainingSeatsInRow.forEach((orderItem, index) => {
        const newSeatKey = `${row}${index + 1}`;
        newMatrix[orderItem.key].seatKey = newSeatKey;
        orderItem.seatKey = newSeatKey;
      });
      
    } else {
      // Thêm ghế mới
      if (selectedSeatType === 'couple') {
        // Xử lý ghế couple - tính toán vị trí partner dựa trên hướng
        const partnerCol = coupleDirection === "right" ? col + 1 : col - 1;
        const partnerKey = `${row}-${partnerCol}`;
        
        // Kiểm tra vị trí partner có hợp lệ không
        if (partnerCol < 1 || partnerCol > maxColumns) {
          messageApi.error(`Không thể tạo ghế couple ở ${coupleDirection === "right" ? "cuối" : "đầu"} hàng`);
          return;
        }

        if (newMatrix[partnerKey]) {
          messageApi.error("Vị trí ghế partner đã được sử dụng");
          return;
        }

        // Tạo seatKey cho cả 2 ghế couple
        const seatKey1 = generateSeatKey(row, newOrder);
        const seatKey2 = generateSeatKey(row, [...newOrder, { key, row, seatKey: seatKey1 }]);

        // Tạo 2 ghế couple
        newMatrix[key] = {
          type: 'couple',
          partnerSeatKey: seatKey2,
          seatKey: seatKey1
        };

        newMatrix[partnerKey] = {
          type: 'couple',
          partnerSeatKey: seatKey1,
          seatKey: seatKey2
        };

        // Thêm vào order theo thứ tự cột (ghế trái trước, ghế phải sau)
        const firstSeat = Math.min(col, partnerCol);
        
        if (col === firstSeat) {
          // Ghế hiện tại là ghế trái
          newOrder.push({
            key,
            seatKey: seatKey1,
            row,
            type: 'couple'
          });
          
          newOrder.push({
            key: partnerKey,
            seatKey: seatKey2,
            row,
            type: 'couple'
          });
        } else {
          // Ghế hiện tại là ghế phải
          newOrder.push({
            key: partnerKey,
            seatKey: seatKey2,
            row,
            type: 'couple'
          });
          
          newOrder.push({
            key,
            seatKey: seatKey1,
            row,
            type: 'couple'
          });
        }
      } else {
        // Ghế standard hoặc vip
        const seatKey = generateSeatKey(row, newOrder);
        
        newMatrix[key] = {
          type: selectedSeatType,
          partnerSeatKey: null,
          seatKey: seatKey
        };

        // Thêm vào order
        newOrder.push({
          key,
          seatKey: seatKey,
          row,
          type: selectedSeatType
        });
      }
    }

    updateSeatLayout(newMatrix, newOrder);
  };

  // Xóa tất cả ghế
  const clearAllSeats = () => {
    setSeatMatrix({});
    setSeatOrder([]);
    onChange([]);
  };

  // Render grid ghế
  const renderSeatGrid = () => {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        padding: '20px', 
        backgroundColor: '#f9f9f9', 
        borderRadius: '8px',
        width: '100%',
        overflowX: 'auto'
      }}>
        {/* Screen indicator */}
        <div style={{
          width: '80%',
          height: '8px',
          background: 'linear-gradient(90deg, #ff6b35 0%, #f7931e 100%)',
          borderRadius: '4px',
          marginBottom: '20px',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            color: '#666',
            fontWeight: 'bold'
          }}>
            MÀN HÌNH
          </div>
        </div>

        {/* Seat grid container */}
        <div style={{ 
          display: 'inline-block',
          minWidth: 'fit-content'
        }}>
          {/* Header số cột */}
          <div style={{ 
            display: 'flex', 
            marginBottom: '8px', 
            marginLeft: '50px' // Offset cho row labels
          }}>
            {Array.from({ length: maxColumns }, (_, i) => (
              <div
                key={i + 1}
                style={{
                  width: '30px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#666',
                  margin: '1px'
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Hàng ghế */}
          {rows.map(row => (
            <div key={row} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '2px'
            }}>
              {/* Label hàng */}
              <div
                style={{
                  width: '40px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginRight: '10px',
                  color: '#333'
                }}
              >
                {row}
              </div>
              
              {/* Các ô ghế trong hàng */}
              <div style={{ display: 'flex' }}>
                {Array.from({ length: maxColumns }, (_, colIndex) => {
                  const col = colIndex + 1;
                  const key = `${row}-${col}`;
                  const seat = seatMatrix[key];
                  
                  return (
                    <SeatCell
                      key={key}
                      row={row}
                      col={col}
                      seat={seat}
                      onClick={() => handleSeatClick(row, col)}
                    />
                  );
                })}
              </div>
              
              {/* Label hàng bên phải */}
              <div
                style={{
                  width: '40px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginLeft: '10px',
                  color: '#333'
                }}
              >
                {row}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render legend
  const renderLegend = () => {
    return (
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <Space wrap>
          <Tag color="default">Trống</Tag>
          <Tag color="blue">Standard</Tag>
          <Tag color="gold">VIP</Tag>
          <Tag color="magenta">Couple</Tag>
        </Space>
      </div>
    );
  };

  // Thống kê ghế
  const getSeatStats = () => {
    const stats = {
      total: Object.keys(seatMatrix).length,
      standard: 0,
      vip: 0,
      couple: 0
    };

    Object.values(seatMatrix).forEach(seat => {
      if (seat.type === 'standard') stats.standard++;
      else if (seat.type === 'vip') stats.vip++;
      else if (seat.type === 'couple') stats.couple++;
    });

    return stats;
  };

  // Render danh sách ghế theo thứ tự với thông tin rõ ràng hơn
  const renderSeatOrder = () => {
    if (seatOrder.length === 0) return null;

    return (
      <Card size="small" title="Danh sách ghế đã tạo (theo thứ tự)" style={{ marginTop: '16px' }}>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <Space wrap>
            {seatOrder.map((orderItem, index) => {
              const seat = seatMatrix[orderItem.key];
              const [row, colStr] = orderItem.key.split('-');
              const col = parseInt(colStr);
              
              let color = 'blue';
              if (seat?.type === 'vip') color = 'gold';
              else if (seat?.type === 'couple') color = 'magenta';
              
              return (
                <Tag key={index} color={color} style={{ margin: '2px', fontSize: '12px' }}>
                  <strong>{seat?.seatKey}</strong> (Hàng {row}, Cột {col})
                  {seat?.type === 'couple' && seat?.partnerSeatKey && (
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>
                      {' '}- đôi với {seat.partnerSeatKey}
                    </span>
                  )}
                </Tag>
              );
            })}
          </Space>
        </div>
      </Card>
    );
  };

  const stats = getSeatStats();

  return (
    <>
      {contextHolder}
      <Card>
        <Row gutter={[16, 16]}>
          {/* Controls */}
          <Col span={24}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={12}>
                <div>
                  <Text strong style={{ marginRight: '12px' }}>Loại ghế: </Text>
                  <Radio.Group 
                    value={selectedSeatType} 
                    onChange={(e) => setSelectedSeatType(e.target.value)}
                  >
                    <Radio value="standard">Standard</Radio>
                    <Radio value="vip">VIP</Radio>
                    <Radio value="couple">Couple</Radio>
                  </Radio.Group>
                </div>
              </Col>
              
              <Col xs={24} md={8}>
                {selectedSeatType === 'couple' && (
                  <div>
                    <Text strong style={{ marginRight: '8px' }}>Hướng ghế couple: </Text>
                    <Select 
                      value={coupleDirection} 
                      onChange={setCoupleDirection}
                      size="small"
                      style={{ width: 120 }}
                    >
                      <Option value="right">→ Phải</Option>
                      <Option value="left">← Trái</Option>
                    </Select>
                  </div>
                )}
              </Col>
              
              <Col xs={24} md={4} style={{ textAlign: 'right' }}>
                <Button 
                  icon={<ClearOutlined />} 
                  onClick={clearAllSeats}
                  danger
                  size="small"
                >
                  Xóa tất cả ghế
                </Button>
              </Col>
            </Row>
          </Col>

          {/* Seat Grid - Centered */}
          <Col span={24}>
            <Title level={5} style={{ textAlign: 'center', marginBottom: '16px' }}>
              Sơ đồ phòng chiếu
            </Title>
            {renderSeatGrid()}
            {renderLegend()}
          </Col>

          {/* Statistics */}
          <Col span={24}>
            <Card size="small" title="Thống kê ghế">
              <Row gutter={[16, 8]}>
                <Col xs={12} sm={6}>
                  <Text>Tổng: <strong style={{ color: '#1890ff' }}>{stats.total}</strong></Text>
                </Col>
                <Col xs={12} sm={6}>
                  <Text>Standard: <strong style={{ color: '#1890ff' }}>{stats.standard}</strong></Text>
                </Col>
                <Col xs={12} sm={6}>
                  <Text>VIP: <strong style={{ color: '#faad14' }}>{stats.vip}</strong></Text>
                </Col>
                <Col xs={12} sm={6}>
                  <Text>Couple: <strong style={{ color: '#eb2f96' }}>{stats.couple}</strong></Text>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Seat Order List */}
          <Col span={24}>
            {renderSeatOrder()}
          </Col>
        </Row>
      </Card>
    </>
  );
};

export default SeatLayoutBuilder;