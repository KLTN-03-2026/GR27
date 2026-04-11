import React from "react";
import { Tabs, Row, Col, Card } from "antd";
import { RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import FilmCard from "../../components/FilmCard";
import "./FilmTabs.scss";

const FilmTabs = ({ films }) => {
  const navigate = useNavigate();
  const now = dayjs();
  const DISPLAY_LIMIT = 7;
  
  const nowShowingFilms = films.filter(film => 
    dayjs(film.releaseDate).isBefore(now) || dayjs(film.releaseDate).isSame(now, 'day')
  ).sort((a,b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  
  const comingSoonFilms = films.filter(film => 
    dayjs(film.releaseDate).isAfter(now)
  ).sort((a,b) => new Date(a.releaseDate) - new Date(b.releaseDate));

  // Card "Xem thêm"
  const SeeMoreCard = ({ type }) => (
    <Card
      hoverable
      className="film-card-item see-more-card"
      onClick={() => navigate(type === 'now-showing' ? '/phim-dang-chieu' : '/phim-sap-chieu')}
    >
      <div className="see-more-content">
        <RightOutlined className="see-more-icon" />
        <div className="see-more-text">Xem thêm</div>
      </div>
    </Card>
  );

  const items = [
    {
      key: "1",
      label: "Phim đang chiếu",
      children: (
        <Row gutter={[24, 24]}>
          {nowShowingFilms.slice(0, DISPLAY_LIMIT).map((film) => (
            <Col key={film._id} xs={24} sm={12} md={8} lg={6} className="film-card-wrapper">
              <FilmCard film={film} />
            </Col>
          ))}
          {nowShowingFilms.length > DISPLAY_LIMIT && (
            <Col xs={24} sm={12} md={8} lg={6} className="film-card-wrapper">
              <SeeMoreCard type="now-showing" />
            </Col>
          )}
        </Row>
      ),
    },
    {
      key: "2",
      label: "Phim sắp chiếu",
      children: (
        <Row gutter={[24, 24]}>
          {comingSoonFilms.slice(0, DISPLAY_LIMIT).map((film) => (
            <Col key={film._id} xs={24} sm={12} md={8} lg={6} className="film-card-wrapper">
              <FilmCard film={film} />
            </Col>
          ))}
          {comingSoonFilms.length > DISPLAY_LIMIT && (
            <Col xs={24} sm={12} md={8} lg={6} className="film-card-wrapper">
              <SeeMoreCard type="coming-soon" />
            </Col>
          )}
        </Row>
      ),
    },
  ];

  return <Tabs defaultActiveKey="1" items={items} centered size="large" />;
};

export default FilmTabs;