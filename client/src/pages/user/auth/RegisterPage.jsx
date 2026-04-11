import { Button, message, Modal, Result, Spin } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../../../components/Form/RegisterForm";
import { cancelRegister, register } from "../../../services/authServices";
import { deleteCookie, getCookie, setCookieCheck } from "../../../helpers/cookie";

function RegisterPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const onFinish = async (values) => {
    try {
      setSpinning(true);
      await register(values);
      
      setTimeout(() => {
        setSpinning(false);
        setOpen(true);
        messageApi.open({
          type: "success",
          content: "Đăng ký thành công, vui lòng xác nhận email để tiếp tục",
        });
      }, 2000);

      setCookieCheck("email", values.email, 300);
    } catch (err) {
      setSpinning(false);
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Đăng ký thất bại",
      });
    }
  };

  const handleCancelRegister = async () => {
    setOpen(false);
    try {
      const emailCancel = getCookie("email");
      const res = await cancelRegister(emailCancel);
      
      if (res) {
        messageApi.open({
          type: "success",
          content: res.message || "Đã hủy đăng ký",
        });
        deleteCookie("email");
        navigate("/auth/register");
      }
    } catch (err) {
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể hủy đăng ký",
      });
    }
  };

  return (
    <>
      {contextHolder}
      <Spin
        spinning={spinning}
        tip={<h2>Đang tiến hành xác nhận thông tin</h2>}
        size="large"
      >
        <RegisterForm onFinish={onFinish} />
      </Spin>

      <Modal
        closable={false}
        maskClosable={false}
        centered
        open={open}
        footer={null}
        width={{
          xs: "90%",
          sm: "80%",
          md: "70%",
          lg: "60%",
          xl: "50%",
          xxl: "40%",
        }}
      >
        <Result
          status="success"
          title="Lưu thông tin thành công!"
          subTitle={<h3>Vui lòng xác nhận email để hoàn tất đăng ký</h3>}
          extra={[
            <Button key="cancel" onClick={handleCancelRegister}>
              Hủy đăng ký
            </Button>,
            <Button
              type="primary"
              onClick={() => navigate("/auth/register/check-email")}
              key="confirm"
            >
              Xác nhận email
            </Button>,
          ]}
        />
      </Modal>
    </>
  );
}

export default RegisterPage;