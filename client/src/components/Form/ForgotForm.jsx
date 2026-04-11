import { Button, Card, Col, Form, Input, Row } from "antd";
import { useNavigate } from "react-router-dom";
import { LockOutlined } from "@ant-design/icons";
import "./Form.scss";

function ForgotForm(props) {
  const { onFinish } = props;
  const navigate = useNavigate();

  return (
    <div className="form-wrapper">
      <Card className="card-forgot">
        <Row justify="center">
          <Col span={24}>
            <div className="card-forgot__icon">
              <LockOutlined style={{ fontSize: 80, color: "#1890ff" }} />
            </div>
          </Col>
          <Col span={24}>
            <div className="card-forgot__title">
              <h2>Quên mật khẩu?</h2>
              <p>
                Vui lòng nhập email của bạn <br />
                Mã OTP xác minh sẽ được gửi tới email của bạn
              </p>
            </div>
          </Col>
          <Col span={24}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Form
                layout="vertical"
                style={{ width: "100%", maxWidth: 400, textAlign: "center" }}
                onFinish={onFinish}
              >
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Vui lòng nhập email" },
                    { type: "email", message: "Email không hợp lệ" }
                  ]}
                >
                  <Input
                    className="card-forgot__input"
                    placeholder="example@gmail.com"
                    type="email"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    className="card-forgot__send"
                    htmlType="submit"
                  >
                    Gửi mã OTP
                  </Button>
                  <br />
                  <Button 
                    type="link" 
                    onClick={() => navigate("/auth/login")} 
                    className="card-forgot__back"
                  >
                    Quay lại đăng nhập
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default ForgotForm;