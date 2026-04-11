import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Typography, Empty, message } from 'antd';
import dayjs from 'dayjs';

import './FilmListPage.scss'; // Sẽ tạo file CSS chung cho cả 2 trang
import { getAllFilms } from '../../../services/filmServices';
import Loading from '../../../components/Loading';
import ErrorDisplay from '../../../components/ErrorDisplay';
import FilmCard from '../../../components/FilmCard';
import { StarOutlined } from "@ant-design/icons";
const { Title } = Typography;

const FilmNowShowingPage = () => {
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

  const nowShowingFilms = useMemo(() => {
    const now = dayjs();
    return films
      .filter(film => 
        dayjs(film.releaseDate).isBefore(now) || dayjs(film.releaseDate).isSame(now, 'day')
      )
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
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
         <StarOutlined style={{ color: '#fe3e49' }} /> Phim Đang Chiếu <StarOutlined style={{ color: '#fe3e49' }} />
        </Title>
        
        {nowShowingFilms.length > 0 ? (
          <Row gutter={[24, 24]}>
            {nowShowingFilms.map((film) => (
              <Col key={film._id} xs={24} sm={12} md={8} lg={6} className="film-card-wrapper">
                <FilmCard film={film} />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Hiện chưa có phim nào đang chiếu." />
        )}
      </div>
    </>
  );
};

export default FilmNowShowingPage;