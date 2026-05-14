// src/components/BookingModal/QRCodePayment.jsx
import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Typography, Button, message, Space, Alert } from "antd";
import { CopyOutlined, BulbOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";

const { Text, Paragraph } = Typography;

const PAYMENT_TIMEOUT_SECONDS = 15 * 60; // 15 phút

const bankLogos = {
  970422: {
    name: "Ngân hàng TMCP Quân đội",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/25/Logo_MB_new.png",
  },
  // Thêm các ngân hàng khác nếu cần
};

const QRCodePayment = ({ paymentData, onCancel, onTimeout }) => {
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_TIMEOUT_SECONDS);
  const onTimeoutRef = useRef(onTimeout);

  // Giữ ref luôn trỏ đến version mới nhất của onTimeout
  // mà không cần thêm vào dependency array của useEffect bên dưới
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeoutRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // chỉ chạy 1 lần khi mount — đúng theo thiết kế

  if (!paymentData) {
    return <Alert message="Không có thông tin thanh toán" type="error" />;
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép: ${text}`);
  };

  const bankInfo = bankLogos[paymentData.bin];

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const countdownText = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isUrgent = secondsLeft <= 60;

  return (
    <div className="qr-payment-container">
      <Alert
        message="Mở App Ngân hàng bất kỳ để quét mã VietQR hoặc chuyển khoản chính xác số tiền bên dưới."
        type="info"
        showIcon
        icon={<BulbOutlined />}
        style={{ marginBottom: 16 }}
      />

      {/* Countdown bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 20,
          padding: "8px 16px",
          borderRadius: 8,
          backgroundColor: isUrgent ? "#fff1f0" : "#f6ffed",
          border: `1px solid ${isUrgent ? "#ffa39e" : "#b7eb8f"}`,
          transition: "background-color 0.3s, border-color 0.3s",
        }}
      >
        <ClockCircleOutlined style={{ color: isUrgent ? "#ff4d4f" : "#52c41a", fontSize: 16 }} />
        <Text style={{ color: isUrgent ? "#ff4d4f" : "#52c41a", fontWeight: 600, fontSize: 15 }}>
          {isUrgent ? "Sắp hết thời gian! " : "Thời gian còn lại: "}
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 18 }}>
            {countdownText}
          </span>
        </Text>
      </div>

      <Row gutter={[32, 16]}>
        <Col xs={24} md={10} style={{ textAlign: "center" }}>
          <div
            style={{
              padding: 16,
              border: "1px solid #f0f0f0",
              borderRadius: 8,
              display: "inline-block",
            }}
          >
            <QRCodeSVG
              value={paymentData.qrCode}
              size={220}
              level={"H"}
              includeMargin={true}
              imageSettings={{
                src: "https://cas.so/img/payOS.png",
                height: 30,
                width: 30,
                excavate: true,
              }}
            />
          </div>

          <Space style={{ marginTop: 8 }}>
            <img
              src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-Napas.png"
              alt="Napas 247"
              height={20}
            />
            {bankInfo && (
              <img src={bankInfo.logo} alt={bankInfo.name} height={20} />
            )}
          </Space>
        </Col>

        <Col xs={24} md={14}>
          <div className="payment-info">
            <div className="info-item">
              <Text type="secondary">Ngân hàng</Text>
              <Text strong>{bankInfo ? bankInfo.name : paymentData.bin}</Text>
            </div>
            <div className="info-item">
              <Text type="secondary">Chủ tài khoản</Text>
              <Text strong>{paymentData.accountName}</Text>
            </div>
            <div className="info-item">
              <Text type="secondary">Số tài khoản</Text>
              <Space>
                <Text strong>{paymentData.accountNumber}</Text>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => handleCopy(paymentData.accountNumber)}
                >
                  Sao chép
                </Button>
              </Space>
            </div>
            <div className="info-item">
              <Text type="secondary">Số tiền</Text>
              <Space>
                <Text strong style={{ color: "#e50914", fontSize: 16 }}>
                  {paymentData.amount.toLocaleString("vi-VN")} đ
                </Text>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => handleCopy(paymentData.amount)}
                >
                  Sao chép
                </Button>
              </Space>
            </div>
            <div className="info-item">
              <Text type="secondary">Nội dung</Text>
              <Space>
                <Text strong>{paymentData.description}</Text>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => handleCopy(paymentData.description)}
                >
                  Sao chép
                </Button>
              </Space>
            </div>
          </div>
          <Paragraph type="warning" style={{ marginTop: 16 }}>
            Lưu ý: Nhập chính xác số tiền và nội dung chuyển khoản.
          </Paragraph>
        </Col>
      </Row>
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Button onClick={onCancel}>Hủy giao dịch</Button>
      </div>
    </div>
  );
};

export default QRCodePayment;