import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Row,
  Col,
  Button,
  message,
  Avatar,
  Typography,
  Empty,
  Badge,
  Alert,
  Tooltip, // ADDED: Import Tooltip
} from "antd";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { getAllCity } from "../../services/cityServices";
import { getAllCinema } from "../../services/cinemaServices";
import Loading from "../../components/Loading";
import { useBooking } from '../../context/BookingContext';
const { Title, Text } = Typography;

const ShowtimesByCinema = () => {
  const [cities, setCities] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [showtimes, setShowtimes] = useState([]);

  const { openBookingModal } = useBooking();

  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedCinemaId, setSelectedCinemaId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );

  const [loading, setLoading] = useState(true);
  const [showtimeLoading, setShowtimeLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // ... (useEffect and other functions remain the same)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cityResult, cinemaResult] = await Promise.all([
          getAllCity(),
          getAllCinema(),
        ]);

        const activeCinemas = cinemaResult.filter((c) => c.status === "active");
        setCinemas(activeCinemas || []);

        const cinemaCityIds = new Set(
          activeCinemas.flatMap((c) =>
            c.cityIds.map((city) => (typeof city === "object" ? city._id : city))
          )
        );
        const sortedCities = (cityResult || []).sort((a, b) => {
          const aHasCinema = cinemaCityIds.has(a._id);
          const bHasCinema = cinemaCityIds.has(b._id);
          return bHasCinema - aHasCinema;
        });
        setCities(sortedCities);

        if (sortedCities.length > 0) {
          const firstCityWithCinema = sortedCities.find((c) =>
            cinemaCityIds.has(c._id)
          );
          setSelectedCityId(
            firstCityWithCinema?._id || sortedCities[0]._id
          );
        }
      } catch (err) {
        messageApi.error("Không thể tải dữ liệu rạp và thành phố");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [messageApi]);

  const fetchShowtimes = useCallback(async () => {
    if (!selectedCinemaId || !selectedDate) return;
    try {
      setShowtimeLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/show-times/cinema/${selectedCinemaId}?date=${selectedDate}`
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
      setShowtimeLoading(false);
    }
  }, [selectedCinemaId, selectedDate, messageApi]);

  useEffect(() => {
    if (selectedCinemaId) {
      fetchShowtimes();
    }
  }, [fetchShowtimes, selectedCinemaId]);

  const groupedAndFilteredCinemas = useMemo(() => {
    if (!selectedCityId || cinemas.length === 0) return {};
  
    const filteredByCity = cinemas.filter(c => 
      c.cityIds.some(city => (typeof city === 'object' ? city._id : city) === selectedCityId)
    );
  
    const grouped = filteredByCity.reduce((acc, cinema) => {
      const brand = cinema.parentId
        ? cinemas.find(c => c._id === (typeof cinema.parentId === 'object' ? cinema.parentId._id : cinema.parentId))
        : cinema;
  
      if (!brand) return acc;
  
      if (!acc[brand._id]) {
        acc[brand._id] = {
          brandInfo: brand,
          children: [],
        };
      }
      
      if(cinema._id !== brand._id) {
        acc[brand._id].children.push(cinema);
      }
  
      return acc;
    }, {});

    Object.values(grouped).forEach(group => {
        if(group.children.length === 0 && filteredByCity.some(c => c._id === group.brandInfo._id)) {
            group.children.push(group.brandInfo);
        }
    });
    
    return grouped;

  }, [selectedCityId, cinemas]);

  useEffect(() => {
    const firstBrandKey = Object.keys(groupedAndFilteredCinemas)[0];
    if (firstBrandKey) {
      const firstBrand = groupedAndFilteredCinemas[firstBrandKey];
      if (firstBrand.children.length > 0) {
        setSelectedCinemaId(firstBrand.children[0]._id);
        return;
      }
    }
    setSelectedCinemaId(null);
    setShowtimes([]);
  }, [groupedAndFilteredCinemas]);

  const dates = Array.from({ length: 7 }).map((_, i) => dayjs().add(i, "day"));
  const selectedCinema = cinemas.find((c) => c._id === selectedCinemaId);
  const cityCinemaCount = useMemo(() => {
    const counts = {};
    cities.forEach((city) => {
      counts[city._id] = cinemas.filter((cinema) =>
        cinema.cityIds.some(
          (c) => (typeof c === "object" ? c._id : c) === city._id
        )
      ).length;
    });
    return counts;
  }, [cinemas, cities]);

  // ADDED: Lấy thời gian hiện tại để so sánh
  const now = dayjs();

  return (
    <>
      {contextHolder}
      <div className="showtimes-by-cinema">
        <Title level={2} style={{ textAlign: "center", marginBottom: "30px" }}>
          Mua vé theo rạp
        </Title>
        <Row gutter={[24, 24]} align="top">
            {/* ... Cột Khu vực và Chọn rạp không đổi ... */}
            <Col xs={24} md={5}>
            <div className="selection-panel city-panel">
              <div className="panel-title">Khu vực</div>
              {loading ? ( <Loading /> ) : (
                cities.map((city) => (
                  <Button
                    key={city._id}
                    block
                    type={selectedCityId === city._id ? "primary" : "text"}
                    onClick={() => setSelectedCityId(city._id)}
                    className="panel-item"
                  >
                    <span>{city.name}</span>
                    <Badge
                      count={cityCinemaCount[city._id] || 0}
                      color={selectedCityId === city._id ? "#fff" : "#1890ff"}
                      style={ selectedCityId === city._id ? { color: "#1890ff" } : {} }
                    />
                  </Button>
                ))
              )}
            </div>
          </Col>

          <Col xs={24} md={7}>
            <div className="selection-panel cinema-panel">
              <div className="panel-title">Chọn rạp</div>
              {loading ? ( <Loading /> ) : Object.keys(groupedAndFilteredCinemas).length > 0 ? (
                Object.values(groupedAndFilteredCinemas).map(
                  ({ brandInfo, children }) => (
                    children.length > 0 && 
                    <div key={brandInfo._id} className="cinema-brand-group">
                      <div className="cinema-brand-header">
                        <Avatar src={brandInfo.avatar} size="small" />
                        <Text strong>{brandInfo.name}</Text>
                      </div>
                      {children.map((cinema) => (
                        <Button
                          key={cinema._id}
                          block
                          type={ selectedCinemaId === cinema._id ? "primary" : "text" }
                          onClick={() => setSelectedCinemaId(cinema._id)}
                          className="panel-item cinema-item"
                        >
                          {cinema.name}
                        </Button>
                      ))}
                    </div>
                  )
                )
              ) : (
                <Empty description="Không có rạp nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div className="showtime-panel">
              <div className="date-selection">
                {dates.map((date) => (
                  <Button
                    key={date.format("YYYY-MM-DD")}
                    type={ selectedDate === date.format("YYYY-MM-DD") ? "primary" : "default" }
                    onClick={() => setSelectedDate(date.format("YYYY-MM-DD"))}
                    className="date-button"
                  >
                    <div className="date-btn-content">
                      <Text strong>{date.format("DD/MM")}</Text>
                      <Text type="secondary" >
                        {date.format("ddd")}
                      </Text>
                    </div>
                  </Button>
                ))}
              </div>

              <Alert
                message="Nhấn vào suất chiếu để tiến hành mua vé"
                type="warning"
                showIcon
                style={{ margin: '16px 16px 0 16px' }}
              />

              {selectedCinema && (
                <div className="selected-cinema-info">
                  <Link to={`/cinema/${selectedCinema.slug}`}>
                  <Title level={4}  className="cinema-name-title">{selectedCinema.name}</Title>
                  </Link>
                  
                  <Text type="secondary">
                    {selectedCinema.address} -{" "}
                    <Link
                      to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        selectedCinema.address
                      )}`}
                      target="_blank"
                    >
                      Bản đồ
                    </Link>
                  </Text>
                </div>
              )}

              <div className="showtime-list">
                {showtimeLoading ? ( <Loading /> ) : showtimes.length > 0 ? (
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
                          <Title level={5} style={{ marginTop: 0, marginBottom: 5 }} >
                            <Link to={`/films/${film.slug}`}>{film.title}</Link>
                          </Title>
                          <Text type="secondary">
                            {film.duration} phút -{" "}
                            {film.categoryIds.map((c) => c.title).join(", ")}
                          </Text>
                          <div className="showtime-buttons">
                            {/* MODIFIED: Thêm logic kiểm tra và Tooltip */}
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
                  <Empty description="Không có suất chiếu phù hợp" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default ShowtimesByCinema;