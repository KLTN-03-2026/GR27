import LayoutUser from "../layouts/LayoutUser";
import LoginAdmin from "../pages/admin/Login";
import LogoutPage from "../pages/common/LogoutPage";
import NotFound from "../pages/common/NotFound";
import Unauthorized from "../pages/common/Unauthorized";
import Home from "../pages/user/Home";
import Search from "../pages/user/Search";
import LoginPage from "../pages/user/auth/LoginPage";
import RegisterPage from "../pages/user/auth/RegisterPage";
import ForgotPage from "../pages/user/auth/ForgotPage";
import ForgotOtpPage from "../pages/user/auth/ForgotOtpPage";
import ResetPasswordPage from "../pages/user/auth/ResetPasswordPage";
import CheckEmailRegisterPage from "../pages/user/auth/CheckEmailRegisterPage";
import  { FilmComingSoonPage, FilmNowShowingPage, FilmDetailPage } from "../pages/user/films";
import { ShowTimeByDetailCinemaPage, ShowTimeListPage } from "../pages/user/showtimes";
import PaymentSuccessPage from "../pages/user/payment/PaymentSuccessPage";
import PaymentCancelPage from "../pages/user/payment/PaymentCancelPage";


const commonRoutes = [
  {
    path: "/",
    element: <LayoutUser />,
    children: [
       { index: true, element: <Home /> },
       { path: "auth/login", element: <LoginPage /> },
       { path: "auth/register", element: <RegisterPage /> },  
       { path: "auth/register/check-email", element: <CheckEmailRegisterPage /> },
       { path: "auth/password/forgot", element: <ForgotPage /> },  
       { path: "auth/password/otp", element: <ForgotOtpPage /> }, 
       { path: "auth/password/reset", element: <ResetPasswordPage /> },
       { path: "search", element: <Search /> },
       {path: "films/:slug", element: <FilmDetailPage />},
       { path: "phim-dang-chieu", element: <FilmNowShowingPage /> },
       { path: "phim-sap-chieu", element: <FilmComingSoonPage /> },
        { path: "show-times", element: <ShowTimeListPage /> },
       { path: "cinema/:slug", element: <ShowTimeByDetailCinemaPage /> },
              { path: "payment/success", element: <PaymentSuccessPage /> },
       { path: "payment/cancel", element: <PaymentCancelPage /> },
    ],
  },
  
  {
    path: "/admin",
    children: [
      {
        path: "auth/login",
        element: <LoginAdmin />
      }
    ]
  },
   // 👈 Error pages - không cần layout
  {
    path: "/unauthorized",
    element: <Unauthorized />  // 403 Forbidden
  },
  {
    path: "/404",
    element: <NotFound />      // 404 Not Found
  },
  // 👈 Catch-all route - phải đặt cuối cùng
  {
    path: "*",
    element: <NotFound />      // Bất kỳ route nào không match sẽ hiển thị 404
  },
  
    { path: "auth/logout", element: <LogoutPage /> },
  
];

export default commonRoutes;
