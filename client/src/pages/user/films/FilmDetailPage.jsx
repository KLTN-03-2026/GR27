import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Space,
  Tabs,
  Button,
  Select,
  message,
  Divider,
  Rate,
  Avatar,
  Input,
  Empty,
  Tooltip,
  Collapse,
  Popconfirm,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  RightOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import YouTubeTrailer from "../../../components/YouTubeTrailer";
import CommentForm from "../../../components/Form/CommentForm";
import { getFilmBySlug } from "../../../services/filmServices";
import { getAllCity } from "../../../services/cityServices";
import {
  getCommentByFilmId,
  createComment,
  reportComment,
  updateComment,
  deleteComment,
} from "../../../services/commentServices";
import { getShowTimeByFilmId } from "../../../services/showTimeServices";
import { useSelector } from "react-redux";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";
import { useBooking } from "../../../context/BookingContext";
import "./FilmDetailPage.scss";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const FilmDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();

  // Auth state
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Film data
  const [filmData, setFilmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Location data
  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [defaultCitySet, setDefaultCitySet] = useState(false);

  // Showtimes data
  const [showtimesData, setShowtimesData] = useState(null);
  const [showtimesLoading, setShowtimesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState("all");

  // Comments data
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentLoading, setCommentLoading] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);

  // Comment form (tạo mới)
  const [rating, setRating] = useState(0);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit comment modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [updatingComment, setUpdatingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("info");

  // Booking modal
  const { openBookingModal } = useBooking();

  // Fetch film data
  const fetchFilmData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getFilmBySlug(slug);
      setFilmData(result.data);
    } catch (err) {
      console.error("Error fetching film:", err);
      setError(err.response?.data?.message || "Không thể tải thông tin phim");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const cityResult = await getAllCity();
        setCities(cityResult || []);

        if (!defaultCitySet && cityResult && cityResult.length > 0) {
          const hcmCity = cityResult.find(
            (city) =>
              city.name === "TP. Hồ Chí Minh" ||
              city.name.includes("Hồ Chí Minh"),
          );
          if (hcmCity) {
            setSelectedCityId(hcmCity._id);
          } else {
            setSelectedCityId(cityResult[0]._id);
          }
          setDefaultCitySet(true);
        }
      } catch (err) {
        console.error("Error fetching cities:", err);
      }
    };
    fetchCities();
  }, [defaultCitySet]);

  // Fetch showtimes
  const fetchShowtimes = useCallback(async () => {
    if (!filmData?._id || !selectedCityId) return;

    try {
      setShowtimesLoading(true);
      const result = await getShowTimeByFilmId(filmData._id);

      const filteredShowtimes = result.data.showtimes
        .map((dateGroup) => ({
          ...dateGroup,
          cinemas: dateGroup.cinemas.filter((cinemaGroup) =>
            cinemaGroup.cinema.cities.some(
              (city) => city._id === selectedCityId,
            ),
          ),
        }))
        .filter((dateGroup) => dateGroup.cinemas.length > 0);

      setShowtimesData({
        ...result.data,
        showtimes: filteredShowtimes,
      });

      if (filteredShowtimes.length > 0 && !selectedDate) {
        setSelectedDate(filteredShowtimes[0].date);
      }
    } catch (err) {
      console.error("Error fetching showtimes:", err);
      messageApi.error("Không thể tải lịch chiếu");
    } finally {
      setShowtimesLoading(false);
    }
  }, [filmData, selectedCityId, selectedDate, messageApi]);

  // Fetch comments
  const fetchComments = useCallback(
    async (page = 1, append = false) => {
      if (!filmData?._id) return;

      try {
        setCommentLoading(true);
        const result = await getCommentByFilmId(filmData._id, page);

        if (append) {
          setComments((prev) => [...prev, ...(result.data || [])]);
        } else {
          setComments(result.data || []);
        }

        setCommentTotal(result.pagination?.total || 0);
        setHasMoreComments(
          result.pagination?.page < result.pagination?.totalPages,
        );
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        setCommentLoading(false);
      }
    },
    [filmData],
  );

  // Load more comments
  const loadMoreComments = () => {
    if (hasMoreComments && !commentLoading) {
      const nextPage = commentPage + 1;
      setCommentPage(nextPage);
      fetchComments(nextPage, true);
    }
  };

  // Submit comment (tạo mới)
  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      messageApi.warning("Vui lòng đăng nhập để đánh giá");
      navigate("/auth/login");
      return;
    }

    if (rating === 0) {
      messageApi.warning("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (!commentContent.trim()) {
      messageApi.warning("Vui lòng nhập nội dung đánh giá");
      return;
    }

    try {
      setSubmittingComment(true);

      await createComment({
        userId: user._id,
        filmId: filmData._id,
        rate: rating,
        content: commentContent.trim(),
      });

      messageApi.success("Gửi đánh giá thành công");

      setRating(0);
      setCommentContent("");

      setCommentPage(1);
      fetchComments(1, false);
    } catch (err) {
      console.error("Error submitting comment:", err);
      messageApi.error(err.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Mở modal sửa bình luận
  const handleOpenEditComment = (comment) => {
    setEditingComment(comment);
    setEditModalOpen(true);
  };

  // Submit sửa bình luận
  const handleUpdateComment = async (values) => {
    if (!editingComment) return;
    try {
      setUpdatingComment(true);
      await updateComment(editingComment._id, {
        rate: values.rate,
        content: values.content,
      });
      messageApi.success("Cập nhật bình luận thành công");
      setEditModalOpen(false);
      setEditingComment(null);
      setCommentPage(1);
      fetchComments(1, false);
    } catch (err) {
      console.error("Error updating comment:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể cập nhật bình luận",
      );
    } finally {
      setUpdatingComment(false);
    }
  };

  // Xóa bình luận
  const handleDeleteComment = async (commentId) => {
    try {
      setDeletingCommentId(commentId);
      await deleteComment(commentId);
      messageApi.success("Đã xóa bình luận");
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentTotal((prev) => prev - 1);
    } catch (err) {
      console.error("Error deleting comment:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể xóa bình luận",
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Report comment
  const handleReportComment = async (commentId) => {
    if (!isAuthenticated) {
      messageApi.warning("Vui lòng đăng nhập để báo cáo");
      navigate("/auth/login");
      return;
    }

    try {
      await reportComment(commentId);
      messageApi.success("Đã gửi báo cáo");
    } catch (err) {
      console.error("Error reporting comment:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể báo cáo bình luận",
      );
    }
  };

  // Handle find showtimes
  const handleFindShowtimes = () => {
    if (!selectedCityId) {
      messageApi.warning("Vui lòng chọn thành phố");
      return;
    }
    setActiveTab("showtimes");
    fetchShowtimes();
  };

  // Handle buy ticket
  const handleBuyTicket = () => {
    setActiveTab("showtimes");
    setTimeout(() => {
      const tabsElement = document.querySelector(".film-content");
      if (tabsElement) {
        tabsElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Initial load
  useEffect(() => {
    if (slug) {
      fetchFilmData();
    }
  }, [slug, fetchFilmData]);

  useEffect(() => {
    if (filmData) {
      fetchComments(1, false);
    }
  }, [filmData, fetchComments]);

  useEffect(() => {
    if (activeTab === "showtimes" && selectedCityId) {
      fetchShowtimes();
    }
  }, [activeTab, selectedCityId, fetchShowtimes]);

  useEffect(() => {
    if (location.state?.showShowtimes) {
      setActiveTab("showtimes");
    }
  }, [location]);

  // Helper: kiểm tra comment có phải của user hiện tại không
  const isOwnComment = (comment) => {
    if (!isAuthenticated || !user) return false;
    const commentUserId =
      typeof comment.userId === "object" ? comment.userId?._id : comment.userId;
    return commentUserId === user._id;
  };

  // Render age rating
  const renderAgeRating = (ageRating) => {
    const ageConfig = {
      P: { color: "green", text: "P" },
      K: { color: "blue", text: "K" },
      T13: { color: "orange", text: "T13" },
      T16: { color: "red", text: "T16" },
      T18: { color: "volcano", text: "T18" },
      C: { color: "black", text: "C" },
    };
    const config = ageConfig[ageRating] || ageConfig.P;
    return (
      <Tag
        color={config.color}
        style={{ fontSize: "14px", fontWeight: "bold" }}
      >
        {config.text}
      </Tag>
    );
  };

  // Render nút action bên phải mỗi comment
  const renderCommentActions = (comment) => {
    if (isOwnComment(comment)) {
      // Bình luận của chính user: hiện Sửa + Xóa
      return (
        <Space size="small">
          <Tooltip title="Chỉnh sửa bình luận">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditComment(comment)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa bình luận"
            description="Bạn có chắc muốn xóa bình luận này không?"
            onConfirm={() => handleDeleteComment(comment._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa bình luận">
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                loading={deletingCommentId === comment._id}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      );
    }

    // Bình luận của người khác: hiện nút Flag (hoặc tag đã báo cáo)
    if (comment.isReported === true) {
      return <Tag color="green">Đã bị báo cáo</Tag>;
    }

    return (
      <Tooltip title="Báo cáo bình luận">
        <Button
          type="text"
          danger
          size="small"
          icon={<FlagOutlined />}
          onClick={() => handleReportComment(comment._id)}
        />
      </Tooltip>
    );
  };

  // Render comments list
  const renderCommentsList = () => (
    <div className="comments-list">
      {comments.length === 0 ? (
        <Empty description="Chưa có đánh giá nào" />
      ) : (
        <>
          {comments.map((comment) => (
            <Card key={comment._id} className="comment-item">
              <Space direction="vertical" style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Space>
                    <Avatar
                      src={comment.userId?.avatar}
                      icon={<UserOutlined />}
                      size={40}
                    />
                    <div>
                      <div style={{ fontWeight: "bold" }}>
                        {comment.userId?.username || "Người dùng"}
                        {isOwnComment(comment) && (
                          <Tag
                            color="blue"
                            style={{ marginLeft: 8, fontSize: "11px" }}
                          >
                            Bạn
                          </Tag>
                        )}
                      </div>
                      <Space size="small">
                        <Rate
                          disabled
                          value={comment.rate}
                          style={{ fontSize: "12px" }}
                        />
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {dayjs(comment.createdAt).fromNow()}
                        </Text>
                      </Space>
                    </div>
                  </Space>

                  {renderCommentActions(comment)}
                </div>

                <Paragraph style={{ marginBottom: 0, marginLeft: "48px" }}>
                  {comment.content}
                </Paragraph>
              </Space>
            </Card>
          ))}

          {hasMoreComments && (
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <Button onClick={loadMoreComments} loading={commentLoading}>
                Xem thêm bình luận
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Get available dates
  const getAvailableDates = () => {
    if (!showtimesData?.showtimes) return [];
    return showtimesData.showtimes.map((dateGroup) => ({
      value: dateGroup.date,
      label: dayjs(dateGroup.date).format("DD/MM"),
      dayOfWeek: dayjs(dateGroup.date).format("ddd"),
      fullDate: dayjs(dateGroup.date).format("DD/MM/YYYY"),
    }));
  };

  const getBrands = () => {
    if (!showtimesData?.showtimes || !selectedDate) return [];

    const dateGroup = showtimesData.showtimes.find(
      (group) => group.date === selectedDate,
    );
    if (!dateGroup) return [];

    const brandsMap = new Map();
    dateGroup.cinemas.forEach((cinemaGroup) => {
      const cinema = cinemaGroup.cinema;
      if (cinema.parentId) {
        const brandId = cinema.parentId._id || cinema.parentId;
        const brandName = cinema.parentId.name || cinema.brandName;
        const brandLogo = cinema.parentId.avatar || cinema.avatar;
        if (!brandsMap.has(brandId)) {
          brandsMap.set(brandId, {
            id: brandId,
            name: brandName,
            logo: brandLogo,
          });
        }
      } else if (cinema.brandName) {
        if (!brandsMap.has(cinema.brandName)) {
          brandsMap.set(cinema.brandName, {
            id: cinema.brandName,
            name: cinema.brandName,
            logo: cinema.avatar,
          });
        }
      }
    });
    return Array.from(brandsMap.values());
  };

  const getCinemasForDateAndBrand = () => {
    if (!showtimesData?.showtimes || !selectedDate) return [];

    const dateGroup = showtimesData.showtimes.find(
      (group) => group.date === selectedDate,
    );
    if (!dateGroup) return [];

    if (selectedBrand === "all") return dateGroup.cinemas;

    return dateGroup.cinemas.filter((cinemaGroup) => {
      const cinema = cinemaGroup.cinema;
      if (cinema.parentId) {
        const brandId = cinema.parentId._id || cinema.parentId;
        return brandId === selectedBrand;
      }
      return cinema.brandName === selectedBrand;
    });
  };

  const formatShowtime = (startTime) => dayjs(startTime).format("HH:mm");

  const renderShowtimesTab = () => {
    if (!selectedCityId) {
      return (
        <Empty
          description="Vui lòng chọn thành phố để xem lịch chiếu"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    if (showtimesLoading) {
      return (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Loading tip="Đang tải lịch chiếu..." />
        </div>
      );
    }

    if (!showtimesData?.showtimes || showtimesData.showtimes.length === 0) {
      return <Empty description="Không có lịch chiếu trong khu vực này" />;
    }

    const availableDates = getAvailableDates();
    const brands = getBrands();
    const cinemas = getCinemasForDateAndBrand();

    return (
      <div className="showtimes-tab-new">
        <div className="city-selector">
          <Select
            showSearch
            placeholder="Chọn thành phố"
            style={{ width: "100%" }}
            size="large"
            value={selectedCityId}
            onChange={(value) => {
              setSelectedCityId(value);
              setSelectedDate(null);
              setSelectedBrand("all");
            }}
            options={cities.map((city) => ({
              label: city.name,
              value: city._id,
            }))}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            suffixIcon={<EnvironmentOutlined />}
          />
        </div>

        <div className="date-selector-horizontal">
          <Button
            className="scroll-btn"
            icon={<span>&lt;</span>}
            onClick={() => {
              document
                .querySelector(".date-buttons-scroll")
                ?.scrollBy({ left: -200, behavior: "smooth" });
            }}
          />
          <div className="date-buttons-scroll">
            {availableDates.map((date) => (
              <Button
                key={date.value}
                type={selectedDate === date.value ? "primary" : "default"}
                className={`date-button ${selectedDate === date.value ? "active" : ""}`}
                onClick={() => {
                  setSelectedDate(date.value);
                  setSelectedBrand("all");
                }}
              >
                <div className="date-content">
                  <div className="date-day">{date.label.split("/")[0]}</div>
                  <div className="date-month">
                    Tháng {date.label.split("/")[1]}
                  </div>
                  <div className="date-weekday">{date.dayOfWeek}</div>
                </div>
              </Button>
            ))}
          </div>
          <Button
            className="scroll-btn"
            icon={<span>&gt;</span>}
            onClick={() => {
              document
                .querySelector(".date-buttons-scroll")
                ?.scrollBy({ left: 200, behavior: "smooth" });
            }}
          />
        </div>

        <div className="brand-filter">
          <div className="brand-tabs">
            <div
              className={`brand-tab-item ${selectedBrand === "all" ? "active" : ""}`}
              onClick={() => setSelectedBrand("all")}
            >
              <div className="brand-icon-square">
                <StarOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
              </div>
              <span>Tất cả</span>
            </div>
            {brands.map((brand) => (
              <div
                key={brand.id}
                className={`brand-tab-item ${selectedBrand === brand.id ? "active" : ""}`}
                onClick={() => setSelectedBrand(brand.id)}
              >
                <div className="brand-icon-square">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} />
                  ) : (
                    <StarOutlined style={{ fontSize: "20px" }} />
                  )}
                </div>
                <span>
                  {brand.name.replace(" Cinemas", "").replace(" Cinema", "")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="cinema-list-collapse">
          {cinemas.length === 0 ? (
            <Empty description="Không có rạp nào trong danh mục này" />
          ) : (
            <Collapse
              accordion
              expandIcon={({ isActive }) => (
                <RightOutlined rotate={isActive ? 90 : 0} />
              )}
              className="cinema-collapse"
            >
              {cinemas.map((cinemaGroup) => (
                <Collapse.Panel
                  key={cinemaGroup.cinema._id}
                  header={
                    <div className="cinema-header">
                      <Space>
                        <Avatar
                          src={cinemaGroup.cinema.avatar}
                          size={40}
                          shape="square"
                        />
                        <div>
                          <div className="cinema-name">
                            {cinemaGroup.cinema.name}
                          </div>
                          <div className="cinema-address">
                            {cinemaGroup.cinema.address}
                          </div>
                        </div>
                      </Space>
                      <Text type="secondary" className="showtime-count">
                        {cinemaGroup.showtimes.length} suất
                      </Text>
                    </div>
                  }
                >
                  <div className="showtimes-grid">
                    {cinemaGroup.showtimes.map((showtime) => (
                      <Button
                        key={showtime._id}
                        className="showtime-button"
                        onClick={() => openBookingModal(showtime)}
                      >
                        <div className="showtime-info">
                          <div className="showtime-time">
                            {formatShowtime(showtime.startTime)}
                          </div>
                          <div className="showtime-end">
                            ~ {formatShowtime(showtime.endTime)}
                          </div>
                          <div className="showtime-seats">
                            {showtime.availableSeats}/{showtime.totalSeats} ghế
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </Collapse.Panel>
              ))}
            </Collapse>
          )}
        </div>
      </div>
    );
  };

  // Loading / Error / No data
  if (loading) return <Loading tip="Đang tải thông tin phim..." />;
  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <ErrorDisplay message={error} onRetry={fetchFilmData} />
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

  // Tab items
  const tabItems = [
    {
      key: "info",
      label: "Thông tin phim",
      children: (
        <Row gutter={[24, 24]}>
          {filmData.trailer && (
            <Col span={24}>
              <YouTubeTrailer
                trailerUrl={filmData.trailer}
                title={`${filmData.title} - Trailer`}
                showCard={false}
              />
            </Col>
          )}

          <Col span={24}>
            <Card title="Tìm suất chiếu" className="showtime-finder">
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={16}>
                  <Select
                    showSearch
                    placeholder="Chọn thành phố"
                    style={{ width: "100%" }}
                    size="large"
                    value={selectedCityId}
                    onChange={setSelectedCityId}
                    options={cities.map((city) => ({
                      label: city.name,
                      value: city._id,
                    }))}
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    suffixIcon={<EnvironmentOutlined />}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Button
                    color="primary"
                    variant="outlined"
                    size="large"
                    block
                    onClick={handleFindShowtimes}
                    disabled={!selectedCityId}
                  >
                    Tìm suất chiếu
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={24}>
            <Card title={`Bình luận & Đánh giá (${commentTotal})`}>
              {isAuthenticated && user.role === "user" ? (
                <Card className="comment-form" style={{ marginBottom: "24px" }}>
                  <Title level={5}>Viết đánh giá của bạn</Title>
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size="large"
                  >
                    <div>
                      <Text>Đánh giá</Text>
                      <br />
                      <Rate
                        value={rating}
                        onChange={setRating}
                        style={{ fontSize: "24px" }}
                      />
                    </div>
                    <div>
                      <Text>Nội dung bình luận</Text>
                      <TextArea
                        rows={4}
                        placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        maxLength={500}
                        showCount
                      />
                    </div>
                    <Button
                      type="primary"
                      onClick={handleSubmitComment}
                      loading={submittingComment}
                      disabled={rating === 0 || !commentContent.trim()}
                    >
                      Gửi đánh giá
                    </Button>
                  </Space>
                </Card>
              ) : (
                <Card className="login-prompt" style={{ marginBottom: "24px" }}>
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Text type="secondary" style={{ fontSize: "16px" }}>
                      Vui lòng đăng nhập để viết đánh giá
                    </Text>
                    <br />
                    <Button
                      type="primary"
                      size="large"
                      style={{ marginTop: "16px" }}
                      onClick={() => navigate("/auth/login")}
                    >
                      Đăng nhập
                    </Button>
                  </div>
                </Card>
              )}
              {renderCommentsList()}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: "showtimes",
      label: "Lịch chiếu",
      children: renderShowtimesTab(),
    },
    {
      key: "reviews",
      label: `Đánh giá (${commentTotal})`,
      children: (
        <div className="reviews-section">
          {isAuthenticated && user.role === "user" ? (
            <Card className="comment-form" style={{ marginBottom: "24px" }}>
              <Title level={5}>Viết đánh giá của bạn</Title>
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="large"
              >
                <div>
                  <Text>Đánh giá</Text>
                  <br />
                  <Rate
                    value={rating}
                    onChange={setRating}
                    style={{ fontSize: "24px" }}
                  />
                </div>
                <div>
                  <Text>Nội dung bình luận</Text>
                  <TextArea
                    rows={4}
                    placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    maxLength={500}
                    showCount
                  />
                </div>
                <Button
                  type="primary"
                  onClick={handleSubmitComment}
                  loading={submittingComment}
                  disabled={rating === 0 || !commentContent.trim()}
                >
                  Gửi đánh giá
                </Button>
              </Space>
            </Card>
          ) : (
            <Card className="login-prompt" style={{ marginBottom: "24px" }}>
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Text type="secondary" style={{ fontSize: "16px" }}>
                  Vui lòng đăng nhập để viết đánh giá
                </Text>
                <br />
                <Button
                  type="primary"
                  size="large"
                  style={{ marginTop: "16px" }}
                  onClick={() => navigate("/auth/login")}
                >
                  Đăng nhập
                </Button>
              </div>
            </Card>
          )}
          {renderCommentsList()}
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      {/* Modal chỉnh sửa bình luận */}
      <CommentForm
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingComment(null);
        }}
        onFinish={handleUpdateComment}
        initialValues={
          editingComment
            ? { rate: editingComment.rate, content: editingComment.content }
            : null
        }
        loading={updatingComment}
      />

      <div className="film-detail-page">
        {/* Film Header */}
        <div className="film-header">
          <Row gutter={[24, 24]}>
            {/* ── CỘT POSTER ── */}
            <Col xs={24} md={8}>
              <div className="film-poster">
                <img src={filmData.thumbnail} alt={filmData.title} />
                {/* Nút Mua Vé dưới poster, cân giữa, có ripple + hover xanh */}
                <div className="buy-ticket-wrapper">
                  <div className="buy-ticket-container">
                    <span className="buy-ticket-pulse" />
                    <button
                      className="buy-ticket-btn"
                      onClick={handleBuyTicket}
                    >
                      Mua vé
                    </button>
                  </div>
                </div>
              </div>
            </Col>

            {/* ── CỘT THÔNG TIN ── */}
            <Col xs={24} md={16}>
              <div className="film-info">
                <Title level={1}>{filmData.title}</Title>

                {filmData.otherTitles && filmData.otherTitles.length > 0 && (
                  <Text type="secondary" italic style={{ fontSize: "16px" }}>
                    {filmData.otherTitles.join(" • ")}
                  </Text>
                )}

                <Divider />

                {/* Rating + Độ tuổi + Định dạng — tất cả inline 1 hàng ngang */}
                <Space size="large" wrap>
                  <Space>
                    <StarOutlined style={{ color: "#faad14" }} />
                    <Text strong>
                      {comments.length > 0
                        ? (
                            comments.reduce((sum, c) => sum + c.rate, 0) /
                            comments.length
                          ).toFixed(1)
                        : "0.0"}
                      /5
                    </Text>
                    <Text type="secondary">({comments.length} đánh giá)</Text>
                  </Space>

                  {/* Độ tuổi inline */}
                  <Space size={4} align="center">
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Độ tuổi:
                    </Text>
                    {renderAgeRating(filmData.ageRating)}
                  </Space>

                  {/* Định dạng inline */}
                  {filmData.availableFormats &&
                    filmData.availableFormats.length > 0 && (
                      <Space size={4} align="center">
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Định dạng:
                        </Text>
                        <Space size={4}>
                          {filmData.availableFormats.map((format) => (
                            <Tag key={format} color="blue">
                              {format}
                            </Tag>
                          ))}
                        </Space>
                      </Space>
                    )}
                </Space>

                <Divider />

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">Khởi chiếu</Text>
                      <Text strong>
                        <CalendarOutlined />{" "}
                        {dayjs(filmData.releaseDate).format("DD/MM/YYYY")}
                      </Text>
                    </Space>
                  </Col>

                  <Col span={12}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">Thời lượng</Text>
                      <Text strong>
                        <ClockCircleOutlined /> {filmData.duration} phút
                      </Text>
                    </Space>
                  </Col>

                  <Col span={12}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">Ngôn ngữ</Text>
                      <Text strong>{filmData.filmLanguage}</Text>
                    </Space>
                  </Col>

                  {filmData.subtitles && (
                    <Col span={12}>
                      <Space direction="vertical" size="small">
                        <Text type="secondary">Phụ đề</Text>
                        <Text strong>{filmData.subtitles}</Text>
                      </Space>
                    </Col>
                  )}
                </Row>

                <Divider />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <Text type="secondary">Thể loại: </Text>
                    <Space wrap>
                      {filmData.categoryIds?.map((category) => (
                        <Tag key={category._id} color="cyan">
                          {typeof category === "object"
                            ? category.title
                            : category}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>

                <Divider />

                <div>
                  <Title level={5}>Nội dung phim</Title>
                  <Paragraph>{filmData.description}</Paragraph>
                </div>

                {filmData.directors && filmData.directors.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <Text type="secondary">Đạo diễn: </Text>
                      <Text strong>{filmData.directors.join(", ")}</Text>
                    </div>
                  </>
                )}

                {filmData.actors && filmData.actors.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <Text type="secondary">Diễn viên: </Text>
                      <Text strong>{filmData.actors.join(", ")}</Text>
                    </div>
                  </>
                )}
              </div>
            </Col>
          </Row>
        </div>

        {/* Tabs Section */}
        <div className="film-content">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </div>
      </div>
    </>
  );
};

export default FilmDetailPage;
