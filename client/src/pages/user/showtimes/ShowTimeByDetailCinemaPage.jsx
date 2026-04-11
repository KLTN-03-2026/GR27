import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // MODIFIED: Import Link
import { Avatar, Typography, message, Divider } from 'antd';
import { EnvironmentOutlined, GlobalOutlined, PushpinOutlined } from '@ant-design/icons'; // MODIFIED: Thêm icon PushpinOutlined

import './ShowTimeDetailPage.scss';
import { getCinemaBySlug } from '../../../services/cinemaServices';
import Loading from '../../../components/Loading';
import ErrorDisplay from '../../../components/ErrorDisplay';
import CinemaShowtimeDisplay from '../../../components/CinemaShowtimeDisplay';

const { Title, Paragraph, Text } = Typography;

const ShowTimeByDetailCinemaPage = () => {
  const { slug } = useParams();
  const [cinema, setCinema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCinemaData = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const cinemaData = await getCinemaBySlug(slug);
        setCinema(cinemaData);
      } catch (err) {
        setError("Không tìm thấy rạp chiếu hoặc đã có lỗi xảy ra.");
        message.error("Không thể tải thông tin rạp chiếu.");
      } finally {
        setLoading(false);
      }
    };
    fetchCinemaData();
  }, [slug]);

  if (loading) {
    return <Loading tip="Đang tải thông tin rạp..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!cinema) {
    return <ErrorDisplay message="Không tìm thấy thông tin rạp chiếu." />;
  }

  const brandName = cinema.parentId ? cinema.parentId.name : cinema.name;

  return (
    <div className="cinema-detail-page">
      {/* MODIFIED: Toàn bộ thông tin giờ nằm trong card này */}
      <div className="cinema-info-header">
        <div className="info-main">
          <Avatar src={cinema.avatar} size={80} className="cinema-avatar" />
          <div className="cinema-info-text">
            <Title level={2}>{cinema.name}</Title>
            <Text type="secondary" className="cinema-address">
              {cinema.address}
            </Text>
            <div className="cinema-meta">
              <Text>
                <EnvironmentOutlined /> {cinema.cityIds.map(c => c.name).join(', ')}
              </Text>
              <Text>
                <GlobalOutlined /> {brandName}
              </Text>
              {/* ADDED: Map Link */}
              <Text>
                <PushpinOutlined /> 
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cinema.address)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  Bản đồ
                </a>
              </Text>
            </div>
          </div>
        </div>
        <Divider />
        <Paragraph className="cinema-description">
          {cinema.description}
        </Paragraph>
      </div>

      {/* Component suất chiếu không đổi */}
      <CinemaShowtimeDisplay cinema={cinema} />
    </div>
  );
};

export default ShowTimeByDetailCinemaPage;