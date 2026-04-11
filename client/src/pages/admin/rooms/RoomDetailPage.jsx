import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Button,
  Descriptions,
  message,
} from "antd";
import {
  EditOutlined,
  ArrowLeftOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getRoomById } from "../../../services/roomServices";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";

const { Title, Text } = Typography;

const RoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch room data
  const fetchRoomData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getRoomById(id);
      setRoomData(result.data);
      console.log("Room data:", result.data);
    } catch (err) {
      console.error("Error fetching room:", err);
      setError(err.response?.data?.message || "Không thể tải thông tin phòng chiếu");
      messageApi.error("Không thể tải thông tin phòng chiếu");
    } finally {
      setLoading(false);
    }
  }, [id, messageApi]);

  useEffect(() => {
    if (id) {
      fetchRoomData();
    } else {
      setError("Không tìm thấy ID phòng chiếu");
      setLoading(false);
    }
  }, [fetchRoomData, id]);

  const handleEdit = () => {
    navigate(`/admin/rooms/edit/${id}`);
  };

  const handleBack = () => {
    navigate("/admin/rooms");
  };

  const handleRetry = () => {
    fetchRoomData();
  };

  // Render status tag
  const renderStatusTag = (status) => {
    const statusConfig = {
      active: { 
        color: "green", 
        text: "Hoạt động", 
        icon: <CheckCircleOutlined /> 
      },
      inactive: { 
        color: "red", 
        text: "Ngưng hoạt động", 
        icon: <CloseCircleOutlined /> 
      },
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // Render cinema info
  const renderCinemaInfo = (cinema) => {
    if (!cinema) return "Chưa cập nhật";
    
    if (typeof cinema === 'object') {
      return (
        <div>
          <Text strong style={{ fontSize: '16px' }}>{cinema.name}</Text>
          {cinema.address && (
            <div style={{ marginTop: '4px', color: '#666' }}>
              <EnvironmentOutlined /> {cinema.address}
            </div>
          )}
        </div>
      );
    }
    
    return cinema;
  };

  // Render supported formats
  const renderSupportedFormats = (formats) => {
    if (!Array.isArray(formats) || formats.length === 0) return "Chưa cập nhật";
    
    const formatColors = {
      '2D': 'blue',
      '3D': 'cyan',
      'IMAX': 'gold',
      '4DX': 'purple'
    };
    
    return (
      <Space wrap>
        {formats.map((format, index) => (
          <Tag key={index} color={formatColors[format] || 'default'}>
            {format}
          </Tag>
        ))}
      </Space>
    );
  };

  // Tính toán phạm vi thực tế của sơ đồ ghế
  const getSeatLayoutBounds = (seatLayout) => {
    if (!seatLayout || seatLayout.length === 0) {
      return { minRow: 'A', maxRow: 'A', minCol: 1, maxCol: 1, rows: ['A'] };
    }

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    
    // Tìm hàng đầu tiên và cuối cùng có ghế
    const occupiedRows = [...new Set(seatLayout.map(seat => seat.row))];
    const minRowIndex = Math.min(...occupiedRows.map(row => rows.indexOf(row)));
    const maxRowIndex = Math.max(...occupiedRows.map(row => rows.indexOf(row)));
    
    // Tìm cột đầu tiên và cuối cùng có ghế
    const minCol = Math.min(...seatLayout.map(seat => seat.number));
    const maxCol = Math.max(...seatLayout.map(seat => seat.number));
    
    // Lấy danh sách hàng cần hiển thị
    const displayRows = rows.slice(minRowIndex, maxRowIndex + 1);
    
    return {
      minRow: rows[minRowIndex],
      maxRow: rows[maxRowIndex],
      minCol,
      maxCol,
      rows: displayRows
    };
  };

  // Render seat layout với grid tối ưu
  const renderSeatLayout = (seatLayout) => {
    if (!seatLayout || seatLayout.length === 0) {
      return <Text type="secondary">Chưa có sơ đồ ghế</Text>;
    }

    const bounds = getSeatLayoutBounds(seatLayout);
    const { minCol, maxCol, rows: displayRows } = bounds;
    const columnCount = maxCol - minCol + 1;

    // Tạo matrix từ seatLayout
    const seatMatrix = {};
    seatLayout.forEach(seat => {
      const key = `${seat.row}-${seat.number}`;
      seatMatrix[key] = seat;
    });

    // Get seat color
    const getSeatColor = (type) => {
      switch (type) {
        case 'standard': return '#1890ff';
        case 'vip': return '#faad14';
        case 'couple': return '#eb2f96';
        default: return '#d9d9d9';
      }
    };

    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px', 
        backgroundColor: '#f9f9f9', 
        borderRadius: '8px',
        width: '100%'
      }}>
        {/* Screen indicator */}
        <div style={{
          width: '80%',
          maxWidth: `${columnCount * 32 + 100}px`,
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

        {/* Seat grid container - căn giữa */}
        <div style={{ 
          display: 'inline-block',
          minWidth: 'fit-content'
        }}>
          {/* Header số cột */}
          <div style={{ 
            display: 'flex', 
            marginBottom: '8px', 
            marginLeft: '50px'
          }}>
            {Array.from({ length: columnCount }, (_, i) => {
              const colNumber = minCol + i;
              return (
                <div
                  key={colNumber}
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
                  {colNumber}
                </div>
              );
            })}
          </div>

          {/* Hàng ghế */}
          {displayRows.map(row => (
            <div key={row} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '2px'
            }}>
              {/* Label hàng */}
              <div style={{
                width: '40px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                marginRight: '10px',
                color: '#333'
              }}>
                {row}
              </div>
              
              {/* Các ô ghế trong hàng - chỉ hiển thị từ minCol đến maxCol */}
              <div style={{ display: 'flex' }}>
                {Array.from({ length: columnCount }, (_, i) => {
                  const col = minCol + i;
                  const key = `${row}-${col}`;
                  const seat = seatMatrix[key];
                  
                  // Nếu không có ghế, render ô trống
                  if (!seat) {
                    return (
                      <div
                        key={key}
                        style={{
                          width: '30px',
                          height: '30px',
                          margin: '1px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '6px',
                          border: '1px solid #e0e0e0'
                        }}
                      />
                    );
                  }

                  // Có ghế - hiển thị với màu và seatKey
                  return (
                    <div
                      key={key}
                      title={`${seat.seatKey} - ${seat.type.toUpperCase()}${seat.partnerSeatKey ? ` (đôi với ${seat.partnerSeatKey})` : ''}\nVị trí: ${row}${col}`}
                      style={{
                        width: '30px',
                        height: '30px',
                        margin: '1px',
                        backgroundColor: getSeatColor(seat.type),
                        color: 'white',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'help',
                        border: `1px solid ${getSeatColor(seat.type)}`,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      {seat.seatKey}
                    </div>
                  );
                })}
              </div>
              
              {/* Label hàng bên phải */}
              <div style={{
                width: '40px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                marginLeft: '10px',
                color: '#333'
              }}>
                {row}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Space wrap>
            <Tag color="default">Trống</Tag>
            <Tag color="blue">Standard</Tag>
            <Tag color="gold">VIP</Tag>
            <Tag color="magenta">Couple</Tag>
          </Space>
        </div>
      </div>
    );
  };

  // Calculate seat statistics
  const getSeatStats = (seatLayout) => {
    if (!seatLayout || seatLayout.length === 0) {
      return { total: 0, standard: 0, vip: 0, couple: 0 };
    }

    const stats = {
      total: seatLayout.length,
      standard: 0,
      vip: 0,
      couple: 0
    };

    seatLayout.forEach(seat => {
      if (seat.type === 'standard') stats.standard++;
      else if (seat.type === 'vip') stats.vip++;
      else if (seat.type === 'couple') stats.couple++;
    });

    return stats;
  };

  if (loading) return <Loading tip="Đang tải thông tin phòng chiếu..." />;

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <ErrorDisplay message={error} onRetry={handleRetry} />
      </div>
    );
  }

  if (!roomData) {
    return (
      <div style={{ padding: "20px" }}>
        <ErrorDisplay message="Không tìm thấy thông tin phòng chiếu" />
      </div>
    );
  }

  const seatStats = getSeatStats(roomData.seatLayout);

  return (
    <>
      {contextHolder}
      <div style={{ padding: "24px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
        {/* Header với nút điều hướng */}
        <div style={{ marginBottom: "24px" }}>
          <Space size="middle">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              size="large"
            >
              Quay lại danh sách
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleEdit}
              size="large"
            >
              Chỉnh sửa phòng chiếu
            </Button>
          </Space>
        </div>

        {/* Title */}
        <Title level={2}>Phòng chiếu: {roomData.name}</Title>

        <Row gutter={[24, 24]}>
          {/* Thông tin rạp chiếu */}
          <Col span={24}>
            <Card title="Thông tin rạp chiếu">
              <Descriptions column={2}>
                <Descriptions.Item label={<><ShopOutlined /> Rạp chiếu</>} span={2}>
                  {renderCinemaInfo(roomData.cinemaId)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Sơ đồ phòng chiếu */}
          <Col span={24}>
            <Card title="Sơ đồ phòng chiếu">
              {renderSeatLayout(roomData.seatLayout)}
            </Card>
          </Col>

          {/* Thông tin nhanh và Thống kê ghế */}
          <Col xs={24} md={12}>
            <Card title="Thống kê ghế">
              <Descriptions column={1}>
                <Descriptions.Item label="Tổng số ghế">
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    {seatStats.total}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ghế Standard">
                  <Tag color="blue" style={{ fontSize: '14px' }}>{seatStats.standard}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ghế VIP">
                  <Tag color="gold" style={{ fontSize: '14px' }}>{seatStats.vip}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ghế Couple">
                  <Tag color="magenta" style={{ fontSize: '14px' }}>{seatStats.couple}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Thông tin nhanh">
              <Descriptions column={1}>
                <Descriptions.Item label="Trạng thái">
                  {renderStatusTag(roomData.status)}
                </Descriptions.Item>
                
                <Descriptions.Item label="Định dạng hỗ trợ">
                  {renderSupportedFormats(roomData.supportedFormats)}
                </Descriptions.Item>
                
                <Descriptions.Item label={<>Ngày tạo</>}>
                  {dayjs(roomData.createdAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>

                <Descriptions.Item label="Cập nhật lần cuối">
                  {dayjs(roomData.updatedAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Thông tin hệ thống */}
          <Col span={24}>
            <Card title="Thông tin hệ thống">
              <Descriptions column={2}>
                <Descriptions.Item label="ID">
                  <Text code>{roomData._id}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default RoomDetailPage;