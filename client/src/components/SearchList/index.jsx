import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Row, Col, Typography, Empty, message } from 'antd';
import { getAllFilms } from '../../services/filmServices';
import FilmCard from '../FilmCard';
import Loading from '../Loading';
import ErrorDisplay from '../ErrorDisplay';

const { Title } = Typography;

// ... (hàm normalizeText không đổi)
const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
  };

const SearchList = () => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [searchParams] = useSearchParams();

  const searchTerm = searchParams.get('s');

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        setLoading(true);
        const result = await getAllFilms();
        setFilms(result.data || []);
      } catch (err) {
        setError("Không thể tải danh sách phim. Vui lòng thử lại.");
        messageApi.error("Lỗi khi tải dữ liệu phim.");
      } finally {
        setLoading(false);
      }
    };
    fetchFilms();
  }, [messageApi]);

const filteredFilms = useMemo(() => {
  if (!searchTerm) return [];

  const normalizedSearchTerm = normalizeText(searchTerm);

  return films.filter((film) => {
    const searchableText = normalizeText([
      film.title,
      ...(film.otherTitles || []),
      ...(film.categoryIds?.map(c => c.title) || []),
      ...(film.actors || []),
      ...(film.directors || []),
      film.description
    ].join(' '));

    return searchableText.includes(normalizedSearchTerm);
  });
}, [films, searchTerm]);

  if (loading) {
    return <Loading tip="Đang tìm kiếm..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <>
      {contextHolder}
      <Title level={2} style={{ marginBottom: '24px' }}>
        Kết quả tìm kiếm cho: "{searchTerm}"
      </Title>
      
      {filteredFilms.length > 0 ? (
        <Row gutter={[24, 24]}>
          {filteredFilms.map((film) => (
            // MODIFIED: Added wrapper class here
            <Col key={film._id} xs={24} sm={12} md={8} lg={6} className="film-card-wrapper">
              <FilmCard film={film} />
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          description={
            <span>
              Không tìm thấy kết quả nào phù hợp với từ khóa "<strong>{searchTerm}</strong>".
            </span>
          }
        />
      )}
    </>
  );
};

export default SearchList;