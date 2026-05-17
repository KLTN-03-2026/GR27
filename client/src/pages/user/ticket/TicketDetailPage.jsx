import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Typography, Image, message, Divider } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { toPng } from "html-to-image";
import dayjs from "dayjs";

import { getOrderDetail } from "../../../services/orderServices";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";
import "./TicketDetailPage.scss";

const { Title, Text } = Typography;

const TicketDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ticketRef = useRef(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await getOrderDetail(orderId);
        if (res.code === 200) {
          if (res.data.paymentStatus !== "paid") {
            message.error(
              "Vé này chưa được thanh toán hoặc thanh toán không thành công."
            );
            setTimeout(() => navigate("/"), 3000);
            setError("Vé không hợp lệ.");
          } else {
            setTicket(res.data);
          }
        } else {
          throw new Error("Không tìm thấy vé");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải thông tin vé.");
        message.error("Lỗi khi tải vé.");
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [orderId, navigate]);

  const handleDownloadTicket = useCallback(() => {
    if (ticketRef.current === null) {
      return;
    }

    const key = "downloading";
    message.loading({ content: "Đang chuẩn bị ảnh vé...", key });

    toPng(ticketRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `movix-ticket-${ticket.ticketCode}.png`;
        link.href = dataUrl;
        link.click();
        message.success({ content: "Đã tải vé về máy!", key, duration: 2 });
      })
      .catch((err) => {
        console.error(err);
        message.error({
          content: "Không thể xuất vé, vui lòng thử lại.",
          key,
          duration: 3,
        });
      });
  }, [ticket]);

  if (loading) return <Loading tip="Đang tải vé của bạn..." />;
  if (error) return <ErrorDisplay message={error} />;
  if (!ticket) return <ErrorDisplay message="Không tìm thấy thông tin vé." />;

  const {
    showtimeId,
    seats,
    comboFoods,
    ticketCode,
    ticketQrUrl,
    totalAmount,
  } = ticket;
  const { filmId, cinemaId, roomId } = showtimeId;

  return (
    <div className="ticket-page-container">
      {/* Vé điện tử */}
      <div className="electronic-ticket" ref={ticketRef}>
        <div className="ticket-main">
          <div className="ticket-header">
            <div className="ticket-logo">MOVIX</div>
          </div>
          <Title level={4} className="ticket-film-title">
            {filmId.title}
          </Title>

          <div className="ticket-info-grid">
            <div className="info-item">
              <span className="label">Rạp</span>
              <span className="value">{cinemaId.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Phòng</span>
              <span className="value">{roomId.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Ngày</span>
              <span className="value">
                {dayjs(showtimeId.startTime).format("DD/MM/YYYY")}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Giờ</span>
              <span className="value">
                {dayjs(showtimeId.startTime).format("HH:mm")}
              </span>
            </div>
          </div>

          <Divider style={{ margin: "16px 0" }} />

          {/* ========================================================== */}
          {/* THAY ĐỔI HIỂN THỊ GHẾ Ở ĐÂY */}
          {/* ========================================================== */}
          <div className="info-item-seats">
            <span className="label">Ghế: </span>
            <span className="value">
              {seats.map((s) => s.seatKey).join(", ")}
            </span>
          </div>

          {comboFoods.length > 0 && (
            <>
              <Divider style={{ margin: "16px 0" }} />
              <div className="ticket-combos">
                <div className="label">Combo</div>
                {comboFoods.map((c) => (
                  <Text key={c.comboFoodId} style={{ display: "block" }}>
                    {c.name} (x{c.quantity})
                  </Text>
                ))}
              </div>
            </>
          )}
          <div className="ticket-total">
            <span className="label">Tổng cộng</span>
            <span className="value">
              {totalAmount.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>

        <div className="ticket-divider"></div>

        <div className="ticket-barcode">
          <Image src={ticketQrUrl} width={180} preview={false} />
          <Text code className="ticket-code">
            {ticketCode}
          </Text>
        </div>
      </div>

      {/* Nút tải về */}
      <Button
        color="cyan"
        variant="solid"
        icon={<DownloadOutlined />}
        size="large"
        onClick={handleDownloadTicket}
      >
        Lưu vé về máy
      </Button>
    </div>
  );
};

export default TicketDetailPage;
