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
  Divider,
  message,
  Avatar,
} from "antd";
import {
  EditOutlined,
  ArrowLeftOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BranchesOutlined,
  HomeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getCinemaById } from "../../../services/cinemaServices";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";

const { Title, Text, Paragraph } = Typography;

const CinemaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [cinemaData, setCinemaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cinema data
  const fetchCinemaData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCinemaById(id);
      setCinemaData(result.data);
      console.log("Cinema data:", result.data);
    } catch (err) {
      console.error("Error fetching cinema:", err);
      setError(err.response?.data?.message || "Không thể tải thông tin rạp chiếu");
      messageApi.error("Không thể tải thông tin rạp chiếu");
    } finally {
      setLoading(false);
    }
  }, [id, messageApi]);

  useEffect(() => {
    if (id) {
      fetchCinemaData();
    } else {
      setError("Không tìm thấy ID rạp chiếu");
      setLoading(false);
    }
  }, [fetchCinemaData, id]);

  const handleEdit = () => {
    navigate(`/admin/cinemas/edit/${id}`);
  };

  const handleBack = () => {
    navigate("/admin/cinemas");
  };

  const handleRetry = () => {
    fetchCinemaData();
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

  // Render cities
  const renderCities = (cities) => {
    if (!Array.isArray(cities) || cities.length === 0) return "Chưa cập nhật";
    
    return (
      <Space wrap>
        {cities.map((city, index) => (
          <Tag key={index} color="blue" icon={<EnvironmentOutlined />}>
            {typeof city === 'object' ? city.name : city}
          </Tag>
        ))}
      </Space>
    );
  };

  // Render parent cinema info
  const renderParentCinema = (parentCinema) => {
    if (!parentCinema) return "Rạp gốc";
    
    return (
      <Space>
        <Avatar 
          src={typeof parentCinema === 'object' ? parentCinema.avatar : null}
          icon={<ShopOutlined />}
          size="small"
        />
        <Text>
          {typeof parentCinema === 'object' ? parentCinema.name : parentCinema}
        </Text>
      </Space>
    );
  };

  if (loading) return <Loading tip="Đang tải thông tin rạp chiếu..." />;

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <ErrorDisplay message={error} onRetry={handleRetry} />
      </div>
    );
  }

  if (!cinemaData) {
    return (
      <div style={{ padding: "20px" }}>
        <ErrorDisplay message="Không tìm thấy thông tin rạp chiếu" />
      </div>
    );
  }

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
              Chỉnh sửa rạp chiếu
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          {/* Cột trái - Avatar và thông tin cơ bản */}
          <Col xs={24} md={8}>
            <Card>
              <div style={{ textAlign: "center" }}>
                <Avatar
                  src={cinemaData.avatar}
                  icon={<ShopOutlined />}
                  size={120}
                  style={{ marginBottom: "16px" }}
                />
                
                <Title level={3} style={{ marginBottom: "8px" }}>
                  {cinemaData.name}
                </Title>

                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <Space wrap>
                    {renderStatusTag(cinemaData.status)}
                    {cinemaData.parentId && (
                      <Tag color="purple" icon={<BranchesOutlined />}>
                        Chi nhánh
                      </Tag>
                    )}
                    {!cinemaData.parentId && (
                      <Tag color="gold" icon={<HomeOutlined />}>
                        Rạp gốc
                      </Tag>
                    )}
                  </Space>
                </Space>
              </div>
            </Card>

            {/* Thông tin nhanh */}
            <Card title="Thông tin nhanh" style={{ marginTop: "16px" }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Trạng thái">
                  {renderStatusTag(cinemaData.status)}
                </Descriptions.Item>
                
                <Descriptions.Item label="Thành phố">
                  {renderCities(cinemaData.cityIds)}
                </Descriptions.Item>
                
                <Descriptions.Item label="Thuộc rạp">
                  {renderParentCinema(cinemaData.parentId)}
                </Descriptions.Item>
                
                <Descriptions.Item
                  label={<><CalendarOutlined /> Ngày tạo</>}
                >
                  {dayjs(cinemaData.createdAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Cột phải - Thông tin chi tiết */}
          <Col xs={24} md={16}>
            {/* Thông tin chi tiết */}
            <Card title="Thông tin chi tiết">
              <Row gutter={[16, 16]}>
                {/* Địa chỉ */}
                <Col span={24}>
                  <div>
                    <Title level={5}>
                      <EnvironmentOutlined /> Địa chỉ
                    </Title>
                    <Paragraph copyable>
                      {cinemaData.address}
                    </Paragraph>
                  </div>
                </Col>

                <Col span={24}>
                  <Divider />
                </Col>

                {/* Mô tả */}
                <Col span={24}>
                  <div>
                    <Title level={5}>Mô tả chi tiết</Title>
                    <Paragraph>{cinemaData.description}</Paragraph>
                  </div>
                </Col>

                <Col span={24}>
                  <Divider />
                </Col>

                {/* Thông tin hệ thống */}
                <Col span={24}>
                  <Title level={5}>Thông tin hệ thống</Title>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="ID">
                          <Text code>{cinemaData._id}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Slug">
                          <Text code>{cinemaData.slug || 'Chưa có'}</Text>
                        </Descriptions.Item>
                      </Descriptions>
                    </Col>
                    
                    <Col xs={24} md={12}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Ngày tạo">
                          {dayjs(cinemaData.createdAt).format("DD/MM/YYYY HH:mm")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Cập nhật lần cuối">
                          {dayjs(cinemaData.updatedAt).format("DD/MM/YYYY HH:mm")}
                        </Descriptions.Item>
                      </Descriptions>
                    </Col>
                  </Row>
                </Col>

                {/* Thông tin parent cinema nếu là chi nhánh */}
                {cinemaData.parentId && typeof cinemaData.parentId === 'object' && (
                  <>
                    <Col span={24}>
                      <Divider />
                    </Col>
                    <Col span={24}>
                      <Title level={5}>
                        <BranchesOutlined /> Thông tin rạp cha
                      </Title>
                      <Card size="small">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar 
                            src={cinemaData.parentId.avatar}
                            icon={<ShopOutlined />}
                            size={48}
                          />
                          <div>
                            <Title level={5} style={{ margin: 0 }}>
                              {cinemaData.parentId.name}
                            </Title>
                            <Text type="secondary">
                              {cinemaData.parentId.address}
                            </Text>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </>
                )}
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default CinemaDetailPage;