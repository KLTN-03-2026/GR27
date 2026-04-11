import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Typography, Empty, message } from 'antd';
import dayjs from 'dayjs';

import './FilmListPage.scss'; // Dùng chung file CSS với trang Phim Đang Chiếu
import { getAllFilms } from '../../../services/filmServices';
import Loading from '../../../components/Loading';
import ErrorDisplay from '../../../components/ErrorDisplay';
import FilmCard from '../../../components/FilmCard';
import { StarOutlined } from "@ant-design/icons";
const { Title } = Typography;

const FilmComingSoonPage = () => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        setLoading(true);
        const result = await getAllFilms();
        // Lấy các phim có status 'active'
        const activeFilms = result.data?.filter(film => film.status === 'active') || [];
        setFilms(activeFilms);
      } catch (err) {
        setError("Không thể tải danh sách phim. Vui lòng thử lại.");
        messageApi.error("Lỗi khi tải dữ liệu phim.");
      } finally {
        setLoading(false);
      }
    };
    fetchFilms();
  }, [messageApi]);

  const comingSoonFilms = useMemo(() => {
    const now = dayjs();
    return films
      .filter(film => dayjs(film.releaseDate).isAfter(now))
      .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
  }, [films]);

  if (loading) {
    return <Loading tip="Đang tải danh sách phim..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <>
      {contextHolder}
      <div className="film-list-page-container">
        <Title level={2} style={{ marginBottom: '32px', textAlign: 'center' }}>
          <StarOutlined style={{ color: '#fe3e49' }} /> Phim Sắp Chiếu <StarOutlined style={{ color: '#fe3e49' }} />
        </Title>
        
        {comingSoonFilms.length > 0 ? (
          <Row gutter={[24, 24]}>
            {comingSoonFilms.map((film) => (
              <Col key={film._id} xs={24} sm={12} md={8} lg={6} className="film-card-wrapper">
                <FilmCard film={film} />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Hiện chưa có thông tin phim sắp chiếu." />
        )}
      </div>
    </>
  );
};

export default FilmComingSoonPage;