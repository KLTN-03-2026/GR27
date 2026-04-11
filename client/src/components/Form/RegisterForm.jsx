import { Button, Card, Col, Form, Input, Row } from "antd";
import { runes } from "runes2";
import { useNavigate } from "react-router-dom";
import "./Form.scss";

function RegisterForm(props) {
  const { onFinish } = props;
  const navigate = useNavigate();

  return (
    <div className="form-wrapper">
      <Row justify="center">
        <Col span={24}>
          <Card className="card-register">
            <div className="card-register__header">
              <div className="card-register__logo">
                <h1>MOVIX</h1>
              </div>
              <div className="card-register__title">
                <h3>Đăng ký tài khoản</h3>
                <p>Tạo tài khoản mới để trải nghiệm</p>
              </div>
            </div>
            <div className="card-register__form">
              <Form
                name="registerForm"
                onFinish={onFinish}
                autoComplete="off"
                layout="vertical"
              >
                <Form.Item
                  label="Tên đăng nhập"
                  name="username"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên đăng nhập" },
                    { min: 3, message: "Tên đăng nhập tối thiểu 4 ký tự" }
                  ]}
                >
                  <Input 
                    className="card-register__input" 
                    placeholder="Nguyễn Văn A"
                  />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Vui lòng nhập email" },
                    { type: "email", message: "Email không hợp lệ" }
                  ]}
                >
                  <Input 
                    className="card-register__input" 
                    placeholder="example@gmail.com"
                  />
                </Form.Item>

                <Form.Item
                  label="Mật khẩu"
                  name="password"
                  className="card-register__input--password"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu" },
                    { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" }
                  ]}
                >
                  <Input.Password
                    className="card-register__input"
                    placeholder="••••••••"
                    count={{
                      show: true,
                      strategy: (txt) => runes(txt).length,
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Vui lòng xác nhận mật khẩu" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Mật khẩu không khớp")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    className="card-register__input"
                    placeholder="••••••••"
                    count={{
                      show: true,
                      strategy: (txt) => runes(txt).length,
                    }}
                  />
                </Form.Item>

                <Form.Item label={null}>
                  <Button
                    className="card-register__btn"
                    type="primary"
                    htmlType="submit"
                  >
                    Đăng ký
                  </Button>
                  <div className="card-register__footer">
                    Đã có tài khoản?
                    <Button
                      className="card-register__login"
                      onClick={() => navigate("/auth/login")}
                      type="link"
                    >
                      Đăng nhập ngay!
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

export default RegisterForm;