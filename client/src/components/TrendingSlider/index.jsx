import React from "react";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import { Typography, Tag } from "antd";
import { PlayCircleOutlined, ClockCircleOutlined, StarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const { Title, Text } = Typography;

const NextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: "block", right: "25px" }}
      onClick={onClick}
    />
  );
};

const PrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: "block", left: "25px", zIndex: 1 }}
      onClick={onClick}
    />
  );
};

const TrendingSlider = ({ films }) => {
  const trendingFilms = films
    .filter((film) => film.isTrending)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const settings = {
    infinite: true,
    slidesToShow: 4, // MODIFIED: Hiển thị 4 phim
    slidesToScroll: 1,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 3000,
    dots: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    swipeToSlide: true, // ADDED: Cho phép kéo để chuyển slide
    draggable: true,    // ADDED: Cho phép kéo bằng chuột
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          centerPadding: "40px",
          centerMode: true,
        },
      },
    ],
  };

  return (
    <div className="trending-slider-container">
      <div className="slider-title"> <StarOutlined style={{ color: '#fe3e49' }}  /> Phim thịnh hành <StarOutlined style={{ color: '#fe3e49' }} /></div>
      <Slider {...settings}>
        {trendingFilms.map((film) => (
          <div key={film._id} className="slider-item">
            <div className="film-card">
              <div className="film-poster">
                <img src={film.thumbnail} alt={film.title} />
                <div className="overlay">
                  <Link to={`/films/${film.slug}`}>
                    <PlayCircleOutlined className="play-icon" />
                  </Link>
                </div>
                {/* ADDED: Giới hạn độ tuổi */}
                <Tag className="age-rating-on-poster">{film.ageRating}</Tag>
              </div>
              <div className="film-info">
                <Title level={5} className="film-title" ellipsis={{ rows: 1 }}>
                   <Link to={`/films/${film.slug}`}>{film.title}</Link>
                </Title>
                <div className="film-meta">
                    <Text className="film-release-date">
                        {dayjs(film.releaseDate).format("DD.MM.YYYY")}
                    </Text>
                    <Text className="film-duration">
                        <ClockCircleOutlined /> {film.duration} phút
                    </Text>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default TrendingSlider;