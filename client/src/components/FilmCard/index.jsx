import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Typography, Tag } from 'antd';
import dayjs from 'dayjs';
import './FilmCard.scss'; // Sẽ tạo file CSS riêng cho card

const { Title, Text } = Typography;

const FilmCard = ({ film }) => {
  // Lấy danh sách tên thể loại
  const categoryTitles = film.categoryIds?.map(c => c.title).join(', ') || 'Đang cập nhật';

  return (
    <Link to={`/films/${film.slug}`}>
      <Card
        hoverable
        className="film-card-item"
        cover={<img alt={film.title} src={film.thumbnail} className="film-card-poster"/>}
      >
        <Title level={5} className="film-card-title" ellipsis={{ rows: 2 }}>
          {film.title}
        </Title>
        <div className="film-card-info">
          <Text><strong>Thể loại:</strong> {categoryTitles}</Text>
          <Text><strong>Thời lượng:</strong> {film.duration} phút</Text>
          <Text><strong>Khởi chiếu:</strong> {dayjs(film.releaseDate).format("DD/MM/YYYY")}</Text>
        </div>
        <Tag className="age-rating-tag" color="orange">{film.ageRating}</Tag>
      </Card>
    </Link>
  );
};

export default FilmCard;