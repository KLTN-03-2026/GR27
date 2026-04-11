import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  message,
  Typography,
  Empty,
  Alert,
  Tooltip,
  Row,
  Col,
} from "antd";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import Loading from "../Loading";
import { useBooking } from "../../context/BookingContext";
import "./CinemaShowtimeDisplay.scss";

const { Title, Text } = Typography;

const CinemaShowtimeDisplay = ({ cinema }) => {
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { openBookingModal } = useBooking();
  const fetchShowtimes = useCallback(async () => {
    if (!cinema?._id || !selectedDate) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/show-times/cinema/${cinema._id}?date=${selectedDate}`
      );
      const result = await response.json();
      if (result.code === 200) {
        setShowtimes(result.data.films || []);
      } else {
        setShowtimes([]);
      }
    } catch (err) {
      messageApi.error("Không thể tải lịch chiếu phim");
      setShowtimes([]);
    } finally {
      setLoading(false);
    }
  }, [cinema, selectedDate, messageApi]);

  useEffect(() => {
    fetchShowtimes();
  }, [fetchShowtimes]);

  const dates = Array.from({ length: 12 }).map((_, i) => dayjs().add(i, "day"));
  const now = dayjs();

  return (
    <>
      {contextHolder}
      <div className="showtime-display-panel">
        <div className="date-selection">
          {dates.map((date) => (
            <Button
              key={date.format("YYYY-MM-DD")}
              type={
                selectedDate === date.format("YYYY-MM-DD")
                  ? "primary"
                  : "default"
              }
              onClick={() => setSelectedDate(date.format("YYYY-MM-DD"))}
              className="date-button"
            >
              <div className="date-btn-content">
                <Text strong>{date.format("DD/MM")}</Text>
                <Text type="secondary">{date.format("ddd")}</Text>
              </div>
            </Button>
          ))}
        </div>

        <Alert
          message="Nhấn vào suất chiếu để tiến hành mua vé"
          type="warning"
          showIcon
          style={{ margin: "16px 16px 0 16px" }}
        />

        <div className="showtime-list-container">
          {loading ? (
            <Loading />
          ) : showtimes.length > 0 ? (
            showtimes.map((film) => (
              <div key={film._id} className="film-showtime-item">
                <Row gutter={16} align="top">
                  <Col xs={24} sm={6}>
                    <Link to={`/films/${film.slug}`}>
                      <img
                        src={film.thumbnail}
                        alt={film.title}
                        style={{ width: "100%", borderRadius: 8 }}
                      />
                    </Link>
                  </Col>
                  <Col xs={24} sm={18}>
                    <Title level={5} style={{ marginTop: 0, marginBottom: 5 }}>
                      <Link to={`/films/${film.slug}`}>{film.title}</Link>
                    </Title>
                    <Text type="secondary">
                      {film.duration} phút -{" "}
                      {film.categoryIds.map((c) => c.title).join(", ")}
                    </Text>
                    <div className="showtime-buttons">
                      {film.showtimes.map((st) => {
                        const isPast = dayjs(st.startTime).isBefore(now);
                        const button = (
                          <Button
                            key={st._id}
                            className="time-btn"
                            disabled={isPast}
                            onClick={() => openBookingModal(st)}
                          >
                            {dayjs(st.startTime).format("HH:mm")}
                          </Button>
                        );
                        if (isPast) {
                          return (
                            <Tooltip title="Suất chiếu này đã qua" key={st._id}>
                              {button}
                            </Tooltip>
                          );
                        }
                        return button;
                      })}
                    </div>
                  </Col>
                </Row>
              </div>
            ))
          ) : (
            <Empty
              description="Không có suất chiếu phù hợp"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default CinemaShowtimeDisplay;
