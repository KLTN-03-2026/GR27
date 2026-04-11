import { Button, Card, Col, Form, Input, Row } from "antd";
import { useEffect, useState } from "react";
import { MailOutlined } from "@ant-design/icons";
import "./Form.scss";

function CheckOtpForm(props) {
  const { onFinish, onResend } = props;
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown === 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className="form-wrapper">
      <Card className="card-otp">
        <Row justify="center">
          <Col span={24}>
            <div className="card-otp__icon">
              <MailOutlined style={{ fontSize: 80, color: "#1890ff" }} />
            </div>
          </Col>
          <Col span={24}>
            <div className="card-otp__title">
              <h2>Xác nhận Email</h2>
              <p>
                Mã OTP đã được gửi qua email của bạn <br />
                Vui lòng nhập mã OTP để hoàn tất đăng ký
              </p>
            </div>
          </Col>
          <Col span={24}>
            <Form style={{ textAlign: "center" }} onFinish={onFinish}>
              <Form.Item
                name="otp"
                rules={[
                  { required: true, message: "Vui lòng nhập mã OTP" },
                  { len: 6, message: "Mã OTP phải có 6 số" }
                ]}
              >
                <Input.OTP 
                  length={6}
                  variant="filled" 
                  type="number"
                />
              </Form.Item>
              <Form.Item label={null}>
                <Button
                  type="primary"
                  className="card-otp__send"
                  htmlType="submit"
                >
                  Xác nhận email
                </Button>
                <br />
                <Button
                  className="card-otp__resend"
                  type="link"
                  disabled={countdown > 0}
                  onClick={async () => {
                    setCountdown(60);
                    onResend();
                  }}
                >
                  {countdown > 0 
                    ? `Gửi lại OTP (${countdown}s)` 
                    : "Gửi lại OTP"}
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default CheckOtpForm;