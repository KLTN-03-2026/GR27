// src/components/BookingModal/QRCodePayment.jsx
import React from "react";
import { Row, Col, Typography, Button, message, Space, Alert } from "antd";
import { CopyOutlined, BulbOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react"; // 1. Import component QRCode từ thư viện

const { Text, Paragraph } = Typography;

const bankLogos = {
  970422: {
    name: "Ngân hàng TMCP Quân đội",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/25/Logo_MB_new.png",
  },
  // Thêm các ngân hàng khác nếu cần
};

const QRCodePayment = ({ paymentData, onCancel }) => {
  if (!paymentData) {
    return <Alert message="Không có thông tin thanh toán" type="error" />;
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép: ${text}`);
  };

  const bankInfo = bankLogos[paymentData.bin];

  return (
    <div className="qr-payment-container">
      <Alert
        message="Mở App Ngân hàng bất kỳ để quét mã VietQR hoặc chuyển khoản chính xác số tiền bên dưới."
        type="info"
        showIcon
        icon={<BulbOutlined />}
        style={{ marginBottom: 24 }}
      />
      <Row gutter={[32, 16]}>
        <Col xs={24} md={10} style={{ textAlign: "center" }}>
          {/* 2. Thay thế thẻ <img> bằng component <QRCode> */}
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
                <Text strong >
                  {paymentData.accountNumber}
                </Text>
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
                <Text strong>
                  {paymentData.description}
                </Text>
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
