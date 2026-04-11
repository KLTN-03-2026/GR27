/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../services/authServices";
import { fetchUser } from "../../redux/actions/auth.action";

function LogoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  useEffect(() => {
    const fetchLogout = async () => {
      try {
        await logout();
        
        dispatch(fetchUser());
        navigate("/");
      } catch (err) {
        alert(err.response?.data?.message || "Không thể lấy thông tin");
      }
    };
    fetchLogout();
  }, [isAuthenticated]);
  return <></>;
}

export default LogoutPage;
