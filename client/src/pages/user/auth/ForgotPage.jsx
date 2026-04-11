import { message } from "antd";
import { useNavigate } from "react-router-dom";
import ForgotForm from "../../../components/Form/ForgotForm";
import { forgotPassword } from "../../../services/authServices";
import { setCookieCheck } from "../../../helpers/cookie";

function ForgotPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values) => {
    try {
      const res = await forgotPassword(values);
      
      messageApi.open({
        type: "success",
        content: res.message || "Mã OTP đã được gửi tới email của bạn",
      });
      
      setCookieCheck("email", values.email, 300);
      
      setTimeout(() => {
        navigate("/auth/password/otp");
      }, 2000);
    } catch (err) {
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể gửi mã OTP",
      });
    }
  };

  return (
    <>
      {contextHolder}
      <ForgotForm onFinish={onFinish} />
    </>
  );
}

export default ForgotPage;