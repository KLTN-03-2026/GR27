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
  Statistic,
} from "antd";
import {
  EditOutlined,
  ArrowLeftOutlined,
  VideoCameraOutlined,
  ShopOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  FormatPainterOutlined,
  SwitcherOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getShowTimeById } from "../../../services/showTimeServices";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";

const { Title, Text } = Typography;

const ShowTimeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [showTimeData, setShowTimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch showtime data
  const fetchShowTimeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getShowTimeById(id);
      setShowTimeData(result.data);
      console.log("ShowTime data:", result.data);
    } catch (err) {
      console.error("Error fetching showtime:", err);
      setError(err.response?.data?.message || "Không thể tải thông tin suất chiếu");
      messageApi.error("Không thể tải thông tin suất chiếu");
    } finally {
      setLoading(false);
    }
  }, [id, messageApi]);

  useEffect(() => {
    if (id) {
      fetchShowTimeData();
    } else {
      setError("Không tìm thấy ID suất chiếu");
      setLoading(false);
    }
  }, [fetchShowTimeData, id]);

  const handleEdit = () => {
    navigate(`/admin/show-times/edit/${id}`);
  };

  const handleBack = () => {
    navigate("/admin/show-times");
  };

  const handleRetry = () => {
    fetchShowTimeData();
  };

  // Render status tag
  const renderStatusTag = (status) => {
    const statusConfig = {
      active: {
        color: "green",
        text: "Hoạt động",
        icon: <CheckCircleOutlined />,
      },
      inactive: {
        color: "red",
        text: "Ngưng hoạt động",
        icon: <CloseCircleOutlined />,
      },
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // Calculate seat statistics
  const getSeatStats = (seats) => {
    if (!seats || seats.length === 0) {
      return { total: 0, booked: 0, available: 0 };
    }

    const booked = seats.filter(seat => seat.status === "blocked" || seat.status === "booked").length;
    const total = seats.length;
    const available = total - booked;

    return { total, booked, available };
  };


  // Get price for seat type
  const getSeatTypePrice = (basePrice, seatTypes, type) => {
    if (!seatTypes || seatTypes.length === 0) return basePrice;
    
    const seatType = seatTypes.find(st => st.type === type);
    if (!seatType) return basePrice;
    
    return basePrice + (seatType.extraFee || 0);
  };

  if (loading) return <Loading tip="Đang tải thông tin suất chiếu..." />;

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <ErrorDisplay message={error} onRetry={handleRetry} />
      </div>
    );
  }

  if (!showTimeData) {
    return (
      <div style={{ padding: "20px" }}>
        <ErrorDisplay message="Không tìm thấy thông tin suất chiếu" />
      </div>
    );
  }

  const seatStats = getSeatStats(showTimeData.seats);
  const filmTitle = typeof showTimeData.filmId === 'object' ? showTimeData.filmId.title : 'N/A';
  const cinemaName = typeof showTimeData.cinemaId === 'object' ? showTimeData.cinemaId.name : 'N/A';
  const roomName = typeof showTimeData.roomId === 'object' ? showTimeData.roomId.name : 'N/A';

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
              Chỉnh sửa suất chiếu
            </Button>
          </Space>
        </div>

        {/* Title */}
        <Title level={2}>Chi tiết suất chiếu</Title>

        <Row gutter={[24, 24]}>
          {/* Thông tin phim và rạp */}
          <Col xs={24} lg={16}>
            <Card title="Thông tin suất chiếu">
              <Descriptions column={1} bordered>
                <Descriptions.Item 
                  label={<><VideoCameraOutlined /> Phim</>}
                >
                  <Text strong style={{ fontSize: '16px' }}>{filmTitle}</Text>
                </Descriptions.Item>

                <Descriptions.Item 
                  label={<><ShopOutlined /> Rạp chiếu</>}
                >
                  <Text strong>{cinemaName}</Text>
                </Descriptions.Item>

                <Descriptions.Item 
                  label={<><AppstoreOutlined /> Phòng chiếu</>}
                >
                  <Text strong>{roomName}</Text>
                </Descriptions.Item>

                <Descriptions.Item 
                  label={<><ClockCircleOutlined /> Giờ bắt đầu</>}
                >
                  <Tag color="blue" style={{ fontSize: '14px' }}>
                    {dayjs(showTimeData.startTime).format("HH:mm DD/MM/YYYY")}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item 
                  label={<><ClockCircleOutlined /> Giờ kết thúc</>}
                >
                  <Tag color="red" style={{ fontSize: '14px' }}>
                    {dayjs(showTimeData.endTime).format("HH:mm DD/MM/YYYY")}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label={<> <FormatPainterOutlined /> Định dạng chiếu </>}>
                  <Tag color="cyan" style={{ fontSize: '14px' }}>
                    {showTimeData.format}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label={<><SwitcherOutlined /> Trạng thái</>}>
                  {renderStatusTag(showTimeData.status)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Giá vé" style={{ marginTop: '24px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Card size="small" style={{ backgroundColor: '#e6f7ff' }}>
                    <Statistic
                      title="Ghế Standard"
                      value={getSeatTypePrice(showTimeData.basePrice, showTimeData.seatTypes, 'standard')}
                      prefix={<DollarOutlined />}
                      suffix="đ"
                      valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                    />
                  </Card>
                </Col>
                
                <Col xs={24} md={8}>
                  <Card size="small" bordered={false} style={{ backgroundColor: '#fffbe6' }}>
                    <Statistic
                      title="Ghế VIP"
                      value={getSeatTypePrice(showTimeData.basePrice, showTimeData.seatTypes, 'vip')}
                      prefix={<DollarOutlined />}
                      suffix="đ"
                      valueStyle={{ color: '#faad14', fontSize: '20px' }}
                    />
                  </Card>
                </Col>
                
                <Col xs={24} md={8}>
                  <Card size="small" bordered={false} style={{ backgroundColor: '#fff0f6' }}>
                    <Statistic
                      title="Ghế Couple"
                      value={getSeatTypePrice(showTimeData.basePrice, showTimeData.seatTypes, 'couple')}
                      prefix={<DollarOutlined />}
                      suffix="đ"
                      valueStyle={{ color: '#eb2f96', fontSize: '20px' }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Thống kê ghế */}
          <Col xs={24} lg={8}>
            <Card title={<><TeamOutlined /> Thống kê ghế</>}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card bordered={false} style={{ backgroundColor: '#f0f5ff' }}>
                    <Statistic
                      title="Tổng số ghế"
                      value={seatStats.total}
                      valueStyle={{ color: '#1890ff', fontSize: '32px', fontWeight: 'bold' }}
                    />
                  </Card>
                </Col>
                
                <Col span={12}>
                  <Card bordered={false} style={{ backgroundColor: '#fff2e8' }}>
                    <Statistic
                      title="Đã đặt"
                      value={seatStats.booked}
                      valueStyle={{ color: '#fa8c16', fontSize: '24px' }}
                    />
                  </Card>
                </Col>
                
                <Col span={12}>
                  <Card bordered={false} style={{ backgroundColor: '#f6ffed' }}>
                    <Statistic
                      title="Còn trống"
                      value={seatStats.available}
                      valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Thông tin hệ thống */}
            <Card title="Thông tin hệ thống" style={{ marginTop: '24px' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="ID">
                  <Text code>{showTimeData._id}</Text>
                </Descriptions.Item>
                
                <Descriptions.Item 
                  label={<><CalendarOutlined /> Ngày tạo</>}
                >
                  {dayjs(showTimeData.createdAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                
                <Descriptions.Item label="Cập nhật lần cuối">
                  {dayjs(showTimeData.updatedAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default ShowTimeDetailPage;