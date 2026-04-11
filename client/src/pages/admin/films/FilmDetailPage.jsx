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
  Image,
  Descriptions,
  Divider,
  message,
} from "antd";
import {
  EditOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  UserOutlined,
  GlobalOutlined,
  CrownOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getFilmById } from "../../../services/filmServices";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";
import YouTubeTrailer from "../../../components/YouTubeTrailer";

// Import YouTubeTrailer component
// import YouTubeTrailer from "../../../components/YouTubeTrailer";

const { Title, Text, Paragraph } = Typography;

const FilmDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [filmData, setFilmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch film data
  const fetchFilmData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getFilmById(id);
      setFilmData(result.data);
      console.log("Film data:", result.data);
    } catch (err) {
      console.error("Error fetching film:", err);
      setError(err.response?.data?.message || "Không thể tải thông tin phim");
      messageApi.error("Không thể tải thông tin phim");
    } finally {
      setLoading(false);
    }
  }, [id, messageApi]);

  useEffect(() => {
    if (id) {
      fetchFilmData();
    } else {
      setError("Không tìm thấy ID phim");
      setLoading(false);
    }
  }, [fetchFilmData, id]);

  const handleEdit = () => {
    navigate(`/admin/films/edit/${id}`);
  };

  const handleBack = () => {
    navigate("/admin/films");
  };

  const handleRetry = () => {
    fetchFilmData();
  };

  // Render status tag
  const renderStatusTag = (status) => {
    const statusConfig = {
      active: { color: "green", text: "Hoạt động" },
      inactive: { color: "red", text: "Ngưng hoạt động" },
      coming_soon: { color: "blue", text: "Sắp chiếu" },
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Render age rating tag
  const renderAgeRatingTag = (ageRating) => {
    const ageConfig = {
      P: { color: "green", text: "P - Mọi lứa tuổi" },
      K: { color: "blue", text: "K - Dưới 13 tuổi" },
      T13: { color: "orange", text: "T13 - Từ 13 tuổi" },
      T16: { color: "red", text: "T16 - Từ 16 tuổi" },
      T18: { color: "volcano", text: "T18 - Từ 18 tuổi" },
      C: { color: "black", text: "C - Cấm chiếu" },
    };
    const config = ageConfig[ageRating] || ageConfig.P;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  if (loading) return <Loading tip="Đang tải thông tin phim..." />;

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <ErrorDisplay message={error} onRetry={handleRetry} />
      </div>
    );
  }

  if (!filmData) {
    return (
      <div style={{ padding: "20px" }}>
        <ErrorDisplay message="Không tìm thấy thông tin phim" />
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
              Chỉnh sửa phim
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          {/* Cột trái - Poster và thông tin cơ bản */}
          <Col xs={24} md={8}>
            <Card>
              <div style={{ textAlign: "center" }}>
                <Image
                  src={filmData.thumbnail}
                  alt={filmData.title}
                  style={{
                    width: "100%",
                    maxWidth: "350px",
                    borderRadius: "8px",
                  }}
                  preview={{
                    mask: <div>Xem ảnh lớn</div>,
                  }}
                />
                
                <Title level={3} style={{ marginTop: "16px", marginBottom: "8px" }}>
                  {filmData.title}
                </Title>

                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  {filmData.otherTitles && filmData.otherTitles.length > 0 && (
                    <Text type="secondary" italic>
                      {filmData.otherTitles.join(" • ")}
                    </Text>
                  )}
                  
                  <Space wrap>
                    {renderStatusTag(filmData.status)}
                    {filmData.isTrending && (
                      <Tag color="gold" icon={<CrownOutlined />}>
                        Thịnh hành
                      </Tag>
                    )}
                  </Space>
                </Space>
              </div>
            </Card>

            {/* Thông tin nhanh */}
            <Card title="Thông tin nhanh" style={{ marginTop: "16px" }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item
                  label={<><CalendarOutlined /> Ngày phát hành</>}
                >
                  {dayjs(filmData.releaseDate).format("DD/MM/YYYY")}
                </Descriptions.Item>
                
                <Descriptions.Item
                  label={<><ClockCircleOutlined /> Thời lượng</>}
                >
                  {filmData.duration} phút
                </Descriptions.Item>
                
                <Descriptions.Item
                  label={<><GlobalOutlined /> Ngôn ngữ</>}
                >
                  {filmData.filmLanguage}
                </Descriptions.Item>
                
                {filmData.subtitles && (
                  <Descriptions.Item label="Phụ đề">
                    {filmData.subtitles}
                  </Descriptions.Item>
                )}
                
                <Descriptions.Item label="Độ tuổi phù hợp">
                  {renderAgeRatingTag(filmData.ageRating)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Cột phải - Thông tin chi tiết */}
          <Col xs={24} md={16}>
            {/* Trailer sử dụng YouTubeTrailer component */}
            {filmData.trailer && (
              <div style={{ marginBottom: "24px" }}>
                <YouTubeTrailer
                  trailerUrl={filmData.trailer}
                  title={`${filmData.title} - Trailer`}
                  showCard={true}
                  cardTitle={
                    <Space>
                      <PlayCircleOutlined />
                      Trailer
                    </Space>
                  }
                />
              </div>
            )}

            {/* Thông tin chi tiết */}
            <Card title="Thông tin chi tiết">
              <Row gutter={[16, 16]}>
                {/* Mô tả phim */}
                <Col span={24}>
                  <div>
                    <Title level={5}>Mô tả phim</Title>
                    <Paragraph>{filmData.description}</Paragraph>
                  </div>
                </Col>

                <Col span={24}>
                  <Divider />
                </Col>

                {/* Diễn viên */}
                {filmData.actors && filmData.actors.length > 0 && (
                  <Col xs={24} md={12}>
                    <div>
                      <Title level={5}>
                        <TeamOutlined /> Diễn viên
                      </Title>
                      <Space wrap>
                        {filmData.actors.map((actor, index) => (
                          <Tag key={index} color="blue">
                            {actor}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </Col>
                )}

                {/* Đạo diễn */}
                {filmData.directors && filmData.directors.length > 0 && (
                  <Col xs={24} md={12}>
                    <div>
                      <Title level={5}>
                        <UserOutlined /> Đạo diễn
                      </Title>
                      <Space wrap>
                        {filmData.directors.map((director, index) => (
                          <Tag key={index} color="green">
                            {director}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </Col>
                )}

                {/* Định dạng chiếu */}
                {filmData.availableFormats && filmData.availableFormats.length > 0 && (
                  <Col xs={24} md={12}>
                    <div>
                      <Title level={5}>Định dạng chiếu</Title>
                      <Space wrap>
                        {filmData.availableFormats.map((format, index) => (
                          <Tag key={index} color="purple">
                            {format}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </Col>
                )}

                <Col span={24}>
                  <Divider />
                </Col>

                {/* Thông tin hệ thống */}
                <Col span={24}>
                  <Title level={5}>Thông tin hệ thống</Title>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Ngày tạo">
                      {dayjs(filmData.createdAt).format("DD/MM/YYYY HH:mm")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Cập nhật lần cuối">
                      {dayjs(filmData.updatedAt).format("DD/MM/YYYY HH:mm")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Slug">
                      <Text code>{filmData.slug}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="ID">
                      <Text code>{filmData._id}</Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default FilmDetailPage;