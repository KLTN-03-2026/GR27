import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

/**
 * PrivateRoutes
 * @param {Array} allowedRoles - danh sách role được phép (["admin"], ["user"], ["admin","user"])
 * @param {String} redirectPath - đường dẫn nếu chưa đăng nhập (mặc định: "/auth/login")
 */
const  PrivateRoutes = ({ allowedRoles = [], redirectPath = "/auth/login" }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const role = user?.role || "";
  // Chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // Không đúng role
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Pass → cho phép vào các route con
  return <Outlet />;
}

export default PrivateRoutes;
