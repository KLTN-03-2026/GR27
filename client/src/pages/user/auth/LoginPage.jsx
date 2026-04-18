import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import LoginForm from "../../../components/Form/LoginForm";
import { login, resendOtp } from "../../../services/authServices";
import { fetchUser } from "../../../redux/actions/auth.action";
import { setCookieCheck } from "../../../helpers/cookie";
import { Modal } from "antd";

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values) => {
  try {
    const { identifier, password } = values;
    await login({ identifier, password });
    
    messageApi.success("Đăng nhập thành công");
    dispatch(fetchUser());
    setTimeout(() => { navigate("/"); }, 1000);
  } catch (err) {
    const errorData = err.response?.data;
    
    // XỬ LÝ RIÊNG CHO TRƯỜNG HỢP PENDING
    if (errorData?.code === "UNVERIFIED_ACCOUNT") {
      Modal.confirm({
        title: 'Tài khoản chưa xác minh',
        content: 'Tài khoản của bạn chưa được xác minh email. Bạn có muốn gửi lại mã OTP và xác minh ngay bây giờ không?',
        okText: 'Xác minh ngay',
        centered: true,
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            // Gửi lại OTP
            await resendOtp({ email: errorData.email, type: "register" });
            // Set cookie để trang CheckEmailRegisterPage có thể đọc
            setCookieCheck("email", errorData.email, 300);
            messageApi.success("Mã OTP đã được gửi lại vào email của bạn");
            navigate("/auth/register/check-email");
          } catch (e) {
            messageApi.error("Không thể gửi lại mã OTP");
          }
        }
      });
      return;
    }

    messageApi.error(errorData?.message || "Đăng nhập thất bại");
  }
};

  return (
    <>
      {contextHolder}
      <LoginForm onFinish={onFinish} />
    </>
  );
}

export default LoginPage;