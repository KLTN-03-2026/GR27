import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import LoginForm from "../../../components/Form/LoginForm";
import { login } from "../../../services/authServices";
import { fetchUser } from "../../../redux/actions/auth.action";

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values) => {
    try {
      const { identifier, password } = values;
      console.log('values', values);
      await login({ identifier, password });
      
      messageApi.open({
        type: "success",
        content: "Đăng nhập thành công",
      });
      
      dispatch(fetchUser());
      
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Đăng nhập thất bại",
      });
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