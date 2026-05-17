import { useState, useEffect } from "react";
import { message } from "antd";

import { getAllFilms } from "../../../services/filmServices";
import Loading from "../../../components/Loading";
import "./HomePage.scss";
import TrendingSlider from "../../../components/TrendingSlider";
import FilmTabs from "../../../components/FilmTabs";
import ShowtimesByCinema from "../../../components/ShowtimesByCinema";

const HomePage = () => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        setLoading(true);
        const result = await getAllFilms();
        setFilms(result.data || []);
      } catch (err) {
        console.error("Error fetching films:", err);
        messageApi.error("Không thể tải danh sách phim");
      } finally {
        setLoading(false);
      }
    };

    fetchFilms();
  }, [messageApi]);

  if (loading) {
    return <Loading tip="Đang tải dữ liệu..." />;
  }

  return (
    <>
      {contextHolder}
      <div className="home-page">
        {/* Trending Slider Section */}
        <section className="trending-section">
          <TrendingSlider films={films} />
        </section>

        {/* Film Tabs Section */}
        <section className="film-tabs-section">
          <div className="container">
            <FilmTabs films={films} />
          </div>
        </section>

        {/* Showtimes by Cinema Section */}
        <section className="showtimes-section">
           <div className="container">
            <ShowtimesByCinema />
           </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;