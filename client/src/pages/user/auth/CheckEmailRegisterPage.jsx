import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import CheckOtpForm from "../../../components/Form/CheckOtpForm";
import { checkEmailOtp, resendOtp } from "../../../services/authServices";
import { deleteCookie, getCookie } from "../../../helpers/cookie";
import { fetchUser } from "../../../redux/actions/auth.action";

function CheckEmailRegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values) => {
    try {
      const email = getCookie("email");
      const data = {
        email: email,
        otp: values.otp
      };

      const res = await checkEmailOtp(data);
      
      if (res) {
        messageApi.open({
          type: "success",
          content: res.message || "Xác nhận email thành công",
        });
        
        dispatch(fetchUser());
        deleteCookie("email");
        
        setTimeout(() => {
          navigate("/");
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
      await resendOtp({ email: email, type: "register" });
      
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

export default CheckEmailRegisterPage;