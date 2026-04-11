import { message } from "antd";
import { useNavigate } from "react-router-dom";
import CheckOtpForm from "../../../components/Form/CheckOtpForm";
import { checkOtp, resendOtp } from "../../../services/authServices";
import { getCookie, setCookieCheck } from "../../../helpers/cookie";

function ForgotOtpPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values) => {
    try {
      const email = getCookie("email");
      const data = {
        email: email,
        otp: values.otp
      };

      const res = await checkOtp(data);
      
      if (res) {
        messageApi.open({
          type: "success",
          content: res.message || "Xác nhận OTP thành công",
        });
        
        setCookieCheck("resetToken", res.resetToken, 300);
        
        setTimeout(() => {
          navigate("/auth/password/reset");
        }, 2000);
      }
    } catch (err) {
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Mã OTP không chính xác",
      });
    }
  };

  const onResend = async () => {
    try {
      const email = getCookie("email");
      await resendOtp({ email: email, type: "forgot" });
      
      messageApi.open({
        type: "success",
        content: "Mã OTP mới đã được gửi",
      });
    } catch (err) {
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể gửi lại OTP",
      });
    }
  };

  return (
    <>
      {contextHolder}
      <CheckOtpForm onFinish={onFinish} onResend={onResend} />
    </>
  );
}

export default ForgotOtpPage;