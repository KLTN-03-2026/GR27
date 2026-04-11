import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import ResetPasswordForm from "../../../components/Form/ResetPasswordForm";
import { resetPassword } from "../../../services/authServices";
import { deleteCookie, getCookie } from "../../../helpers/cookie";
import { fetchUser } from "../../../redux/actions/auth.action";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values) => {
    try {
      const resetPasswordObject = {
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
        resetToken: getCookie("resetToken"),
        email: getCookie("email")
      };

      const res = await resetPassword(resetPasswordObject);
      
      if (res) {
        messageApi.open({
          type: "success",
          content: res.message || "Đổi mật khẩu thành công",
        });
        
        deleteCookie("email");
        deleteCookie("resetToken");
        
        dispatch(fetchUser());
        
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (err) {
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể đổi mật khẩu",
      });
    }
  };

  return (
    <>
      {contextHolder}
      <ResetPasswordForm onFinish={onFinish} />
    </>
  );
}

export default ResetPasswordPage;