// src/pages/admin/Login/index.jsx
import React, { useState } from "react";
import { Form, Input, Button, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../../services/authServices";
import { fetchUser } from "../../../redux/actions/auth.action";
import "./Login.scss";

const { Title, Text } = Typography;

const LoginAdmin = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const handleLogin = async (values) => {
    try {
      setLoading(true);
      // Gọi API login
      await login({
        identifier: values.identifier,
        password: values.password,
      });

      messageApi.open({
        type: "success",
        content: "Đăng nhập thành công",
        duration: 2,
      });
      // Lấy thông tin user sau khi login
      await dispatch(fetchUser());

      // Redirect tới dashboard
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1000);
    } catch (err) {
      console.error("Login error:", err);
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể lấy thông tin",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginFailed = (errorInfo) => {
    console.log("Login validation failed:", errorInfo);
    message.error("Vui lòng kiểm tra lại thông tin đăng nhập!");
  };

  return (
    <>
      {contextHolder}
      <div className="login-admin">
        <div className="login-admin__container">
          <div className="login-admin__header">
            <div className="login-admin__logo">
              <div className="login-admin__logo-icon">MV</div>
            </div>
            <Title level={2} className="login-admin__title">
              Admin Portal
            </Title>
            <Text className="login-admin__subtitle">
              Đăng nhập để quản trị hệ thống
            </Text>
          </div>

          <Form
            form={form}
            name="loginAdmin"
            className="login-admin__form"
            onFinish={handleLogin}
            onFinishFailed={handleLoginFailed}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="identifier"
              label="Tên đăng nhập / Email"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tên đăng nhập hoặc email!",
                },
                {
                  min: 4,
                  message: "Tên đăng nhập phải có ít nhất 4 ký tự!",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập tên đăng nhập hoặc email"
                size="large"
                className="login-admin__input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mật khẩu!",
                },
                {
                  min: 8,
                  message: "Mật khẩu phải có ít nhất 8 ký tự!",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu"
                size="large"
                className="login-admin__input"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                className="login-admin__button"
                block
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <div className="login-admin__footer">
            <Text type="secondary">
              © 2024 Movie Admin System. All rights reserved.
            </Text>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginAdmin;
