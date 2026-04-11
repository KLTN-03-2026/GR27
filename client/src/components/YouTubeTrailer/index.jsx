import React from "react";
import { Card, Typography } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

const { Text } = Typography;

const YouTubeTrailer = ({
  trailerUrl,
  title = "Video Trailer",
  showCard = true,
  cardTitle = null,
  aspectRatio = "56.25%", // 16:9 ratio (9/16 * 100)
  borderRadius = "8px",
  allowFullScreen = true,
  autoplay = false,
  showControls = true,
  modestBranding = true,
  rel = false, // không hiển thị video liên quan
}) => {
  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url || typeof url !== "string") return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&#?]*)/,
      /youtube\.com\/v\/([^&#?]*)/,
      /youtube\.com\/user\/[^/]*\/[^/]*\/([^&#?]*)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[1].length === 11) {
        return match[1];
      }
    }
    return null;
  };

  // Convert YouTube URL to embed URL with parameters
  const getYouTubeEmbedUrl = (url) => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;

    const params = new URLSearchParams({
      modestbranding: modestBranding ? "1" : "0",
      rel: rel ? "1" : "0",
      controls: showControls ? "1" : "0",
      autoplay: autoplay ? "1" : "0",
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  const embedUrl = getYouTubeEmbedUrl(trailerUrl);

  // Render error state
  const renderError = (message) => (
    <div
      style={{
        position: "relative",
        paddingTop: aspectRatio,
        overflow: "hidden",
        borderRadius,
        backgroundColor: "#f5f5f5",
        border: "1px dashed #d9d9d9",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          color: "#999",
        }}
      >
        <PlayCircleOutlined style={{ fontSize: "48px", marginBottom: "8px" }} />
        <div>
          <Text type="secondary">{message}</Text>
        </div>
      </div>
    </div>
  );

  // Render iframe content
  const renderIframe = () => {
    if (!embedUrl) {
      return renderError("URL trailer không hợp lệ");
    }

    return (
      <div
        style={{
          position: "relative",
          paddingTop: aspectRatio,
          overflow: "hidden",
          borderRadius,
        }}
      >
        <iframe
          src={embedUrl}
          title={title}
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            border: "none",
          }}
          allowFullScreen={allowFullScreen}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
        />
      </div>
    );
  };

  // Nếu không có trailer URL
  if (!trailerUrl) {
    const content = renderError("Không có trailer");
    return showCard ? (
      <Card title={cardTitle || "Trailer"}>{content}</Card>
    ) : (
      content
    );
  }

  // Render với hoặc không có Card wrapper
  const content = renderIframe();

  if (showCard) {
    return (
      <Card
        title={
          cardTitle || (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <PlayCircleOutlined />
              Trailer
            </div>
          )
        }
      >
        {content}
      </Card>
    );
  }

  return content;
};

YouTubeTrailer.propTypes = {
  trailerUrl: PropTypes.string,
  title: PropTypes.string,
  showCard: PropTypes.bool,
  cardTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  aspectRatio: PropTypes.string,
  borderRadius: PropTypes.string,
  allowFullScreen: PropTypes.bool,
  autoplay: PropTypes.bool,
  showControls: PropTypes.bool,
  modestBranding: PropTypes.bool,
  rel: PropTypes.bool,
};

export default YouTubeTrailer;
