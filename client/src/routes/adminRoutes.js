// src/routes/adminRoutes.js
import { lazy, Suspense } from "react";
import LayoutAdmin from "../layouts/LayoutAdmin";
import PrivateRoutes from "./PrivateRoutes";
import Loading from "../components/Loading";

//  Lazy load các component
const DashBoardPage = lazy(() => import("../pages/admin/Dashboard"));
const FilmListPage = lazy(() => import("../pages/admin/films/FilmListPage"));
const FilmCreatePage = lazy(() =>
  import("../pages/admin/films/FilmCreatePage")
);
const FilmEditPage = lazy(() => import("../pages/admin/films/FilmEditPage"));
const FilmDetailPage = lazy(() =>
  import("../pages/admin/films/FilmDetailPage")
);
const CinemaListPage = lazy(() =>
  import("../pages/admin/cinemas/CinemaListPage")
);
const CinemaDetailPage = lazy(() =>
  import("../pages/admin/cinemas/CinemaDetailPage")
);
const CinemaCreatePage = lazy(() =>
  import("../pages/admin/cinemas/CinemaCreatePage")
);
const CinemaEditPage = lazy(() =>
  import("../pages/admin/cinemas/CinemaEditPage")
);
const RoomCreatePage = lazy(() =>
  import("../pages/admin/rooms/RoomCreatePage")
);
const RoomEditPage = lazy(() => import("../pages/admin/rooms/RoomEditPage"));
const RoomDetailPage = lazy(() =>
  import("../pages/admin/rooms/RoomDetailPage")
);
const RoomListPage = lazy(() => import("../pages/admin/rooms/RoomListPage"));
const ShowTimeListPage = lazy(() =>
  import("../pages/admin/showtimes/ShowTimeListPage")
);
const ShowTimeCreatePage = lazy(() =>
  import("../pages/admin/showtimes/ShowTimeCreatePage")
);
const ShowTimeEditPage = lazy(() =>
  import("../pages/admin/showtimes/ShowTimeEditPage")
);
const ShowTimeDetailPage = lazy(() =>
  import("../pages/admin/showtimes/ShowTimeDetailPage")
);
const OrderListPage = lazy(() => import("../pages/admin/orders/OrderListPage"));

const OrderDetailPage = lazy(() =>
  import("../pages/admin/orders/OrderDetailPage")
);

const MemberListPage = lazy(() =>
  import("../pages/admin/members/MemberListPage")
);

const MemberDetailPage = lazy(() =>
  import("../pages/admin/members/MemberDetailPage")
);

const CommentListPage = lazy(() => import("../pages/admin/comments/CommentListPage"));

//  Wrapper component với Suspense
const LazyWrapper = ({ children }) => (
  <Suspense fallback={<Loading tip="Đang tải trang..." />}>{children}</Suspense>
);

const adminRoutes = [
  {
    element: (
      <PrivateRoutes
        allowedRoles={["admin"]}
        redirectPath="/admin/auth/login"
      />
    ),
    children: [
      {
        path: "/admin",
        element: <LayoutAdmin />,
        children: [
          {
            index: true,
            element: (
              <LazyWrapper>
                <DashBoardPage />
              </LazyWrapper>
            ),
          },
          {
            path: "dashboard",
            element: (
              <LazyWrapper>
                <DashBoardPage />
              </LazyWrapper>
            ),
          },

          // Films
          {
            path: "films",
            element: (
              <LazyWrapper>
                <FilmListPage />
              </LazyWrapper>
            ),
          },
          {
            path: "films/:id",
            element: (
              <LazyWrapper>
                <FilmDetailPage />
              </LazyWrapper>
            ),
          },
          {
            path: "films/create",
            element: (
              <LazyWrapper>
                <FilmCreatePage />
              </LazyWrapper>
            ),
          },
          {
            path: "films/edit/:id",
            element: (
              <LazyWrapper>
                <FilmEditPage />
              </LazyWrapper>
            ),
          },

          // Cinemas
          {
            path: "cinemas",
            element: (
              <LazyWrapper>
                <CinemaListPage />
              </LazyWrapper>
            ),
          },
          {
            path: "cinemas/:id",
            element: (
              <LazyWrapper>
                <CinemaDetailPage />
              </LazyWrapper>
            ),
          },
          {
            path: "cinemas/create",
            element: (
              <LazyWrapper>
                <CinemaCreatePage />
              </LazyWrapper>
            ),
          },
          {
            path: "cinemas/edit/:id",
            element: (
              <LazyWrapper>
                <CinemaEditPage />
              </LazyWrapper>
            ),
          },

          // Rooms
          {
            path: "rooms/create",
            element: (
              <LazyWrapper>
                <RoomCreatePage />
              </LazyWrapper>
            ),
          },
          {
            path: "rooms/edit/:id",
            element: (
              <LazyWrapper>
                <RoomEditPage />
              </LazyWrapper>
            ),
          },
          {
            path: "rooms/:id",
            element: (
              <LazyWrapper>
                <RoomDetailPage />
              </LazyWrapper>
            ),
          },
          {
            path: "rooms",
            element: (
              <LazyWrapper>
                <RoomListPage />
              </LazyWrapper>
            ),
          },

          // showtimes
          {
            path: "show-times",
            element: (
              <LazyWrapper>
                <ShowTimeListPage />
              </LazyWrapper>
            ),
          },
          {
            path: "show-times/create",
            element: (
              <LazyWrapper>
                <ShowTimeCreatePage />
              </LazyWrapper>
            ),
          },
          {
            path: "show-times/edit/:id",
            element: (
              <LazyWrapper>
                <ShowTimeEditPage />
              </LazyWrapper>
            ),
          },
          {
            path: "show-times/:id",
            element: (
              <LazyWrapper>
                <ShowTimeDetailPage />
              </LazyWrapper>
            ),
          },

          //orders
          {
            path: "orders",
            element: (
              <LazyWrapper>
                <OrderListPage />
              </LazyWrapper>
            ),
          },
          {
            path: "orders/:id",
            element: (
              <LazyWrapper>
                <OrderDetailPage />
              </LazyWrapper>
            ),
          },

          // members
          {
            path: "members",
            element: (
              <LazyWrapper>
                <MemberListPage />
              </LazyWrapper>
            ),
          },
          {
            path: "members/:id",
            element: (
              <LazyWrapper>
                <MemberDetailPage />
              </LazyWrapper>
            ),
          },
          // comments
          {
            path: "comments",
            element: (
              <LazyWrapper>
                <CommentListPage />
              </LazyWrapper>
            ),
          },
         
        ],
      },
    ],
  },
];

export default adminRoutes;
