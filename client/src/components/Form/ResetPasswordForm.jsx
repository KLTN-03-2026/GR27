import { Button, Card, Col, Form, Input, Row } from "antd";
import { SafetyOutlined } from "@ant-design/icons";
import { runes } from "runes2";
import "./Form.scss";

function ResetPasswordForm(props) {
  const { onFinish } = props;

  return (
    <div className="form-wrapper">
      <Card className="card-reset">
        <Row justify="center">
          <Col span={24}>
            <div className="card-reset__icon">
              <SafetyOutlined style={{ fontSize: 80, color: "#52c41a" }} />
            </div>
          </Col>
          <Col span={24}>
            <div className="card-reset__title">
              <h2>Đặt lại mật khẩu</h2>
              <p>Nhập mật khẩu mới của bạn</p>
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
                  label="Mật khẩu mới"
                  name="newPassword"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu mới" },
                    { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" }
                  ]}
                >
                  <Input.Password
                    className="card-reset__input"
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
                  dependencies={["newPassword"]}
                  rules={[
                    { required: true, message: "Vui lòng xác nhận mật khẩu" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("newPassword") === value) {
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
                    className="card-reset__input"
                    placeholder="••••••••"
                    count={{
                      show: true,
                      strategy: (txt) => runes(txt).length,
                    }}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    className="card-reset__send"
                    htmlType="submit"
                  >
                    Xác nhận đổi mật khẩu
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

export default ResetPasswordForm;