import React, { forwardRef } from "react";
import { Typography, Image, Divider } from "antd";
import dayjs from "dayjs";
import "./TicketDetailPage.scss"; 

const { Title, Text } = Typography;

// Sử dụng forwardRef để component cha có thể tham chiếu đến div của vé
const TicketRenderer = forwardRef(({ ticket }, ref) => {
  if (!ticket) return null;

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
    // Dùng className "electronic-ticket" giống hệt trang chi tiết vé
    <div className="ticket-page-container">
      <div className="electronic-ticket" ref={ref}>
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
    </div>
  );
});

export default TicketRenderer;
