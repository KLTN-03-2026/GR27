import React from "react";
import ShowtimesByCinema from "../../../components/ShowtimesByCinema";
const ShowTimeListPage = () => {
  return (
    <>
      {/* Showtimes by Cinema Section */}
      <section className="showtimes-section">
        <div className="container">
          <ShowtimesByCinema />
        </div>
      </section>
    </>
  );
};

export default ShowTimeListPage;
