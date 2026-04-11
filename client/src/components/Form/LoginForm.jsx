import { Button, Card, Col, Input, Row, Form } from "antd";
import { useNavigate } from "react-router-dom";
import { runes } from "runes2";


import "./Form.scss";

function LoginForm(props) {
  const { onFinish } = props;
  const navigate = useNavigate();

  return (
    <div className="form-wrapper">
      <Row justify="center">
        <Col span={24}>
          <Card className="card-login">
            <div className="card-login__header">
              <div className="card-login__logo">
                <h1>MOVIX</h1>
              </div>
              <div className="card-login__title">
                <h3>Chào mừng trở lại</h3>
                <p>Đăng nhập để tiếp tục</p>
              </div>
            </div>
            <div className="card-login__form">
              <Form name="loginForm" onFinish={onFinish} layout="vertical">
                <Form.Item
                  label="Tên đăng nhập/Email"
                  name="identifier"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên đăng nhập hoặc email" }
                  ]}
                >
                  <Input 
                    className="card-login__input" 
                    placeholder="abc123/example@gmail.com"
                  />
                </Form.Item>

                <Form.Item
                  label="Mật khẩu"
                  className="card-login__input--password"
                  name="password"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu" },
                    { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" }
                  ]}
                >
                  <Input.Password
                    className="card-login__input"
                    placeholder="••••••••"
                    count={{
                      show: true,
                      strategy: (txt) => runes(txt).length,
                    }}
                  />
                </Form.Item>

                <Form.Item label={null} className="card-login__forgot--input">
                  <Button
                    className="card-login__forgot"
                    onClick={() => navigate("/auth/password/forgot")}
                    type="link"
                  >
                    Quên mật khẩu?
                  </Button>
                </Form.Item>

                <Form.Item label={null}>
                  <Button
                    className="card-login__btn"
                    type="primary"
                    htmlType="submit"
                  >
                    Đăng nhập
                  </Button>
                  <div className="card-login__footer">
                    Chưa có tài khoản?
                    <Button
                      className="card-login__register"
                      onClick={() => navigate("/auth/register")}
                      type="link"
                    >
                      Đăng ký ngay!
                    </Button>
                  </div>
                </Form.Item>
              </Form>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default LoginForm;