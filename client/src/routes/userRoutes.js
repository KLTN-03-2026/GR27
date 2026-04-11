import LayoutUser from "../layouts/LayoutUser";
import Profile from "../pages/user/Profile";
import TicketDetailPage from "../pages/user/ticket/TicketDetailPage";
import TicketHistoryListPage from "../pages/user/ticket/TicketHistoryListPage";
import PrivateRoutes from "./PrivateRoutes";


const userRoutes = [
  {
    element: <PrivateRoutes allowedRoles={["user"]} redirectPath="/auth/login" />,
    children: [
      {
        element: <LayoutUser />,
        children: [
          { path: "user", element: <Profile /> },
          { path: "ticket/:orderId", element: <TicketDetailPage /> },
          { path: "my-tickets", element: <TicketHistoryListPage /> },
          // { path: "profile", element: <ProfilePage /> },
          // { path: "my-tickets", element: <MyTicketsPage /> },
          // { path: "payment", element: <PaymentPage /> },
          // { path: "carts", element: <CartPage /> },
        ],
      },
    ],
  },
];

export default userRoutes;
