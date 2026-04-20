// src/routes/adminRoutes.js
import { lazy, Suspense } from "react";
import LayoutAdmin from "../layouts/LayoutAdmin";
import PrivateRoutes from "./PrivateRoutes";
import Loading from "../components/Loading";

// Lazy load các component
const DashBoardPage = lazy(() => import("../pages/admin/Dashboard"));

const FilmListPage = lazy(() => import("../pages/admin/films/FilmListPage"));
const FilmCreatePage = lazy(() => import("../pages/admin/films/FilmCreatePage"));
const FilmEditPage = lazy(() => import("../pages/admin/films/FilmEditPage"));
const FilmDetailPage = lazy(() => import("../pages/admin/films/FilmDetailPage"));
const FilmTrashPage = lazy(() => import("../pages/admin/films/FilmTrashPage"));

const CinemaListPage = lazy(() => import("../pages/admin/cinemas/CinemaListPage"));
const CinemaDetailPage = lazy(() => import("../pages/admin/cinemas/CinemaDetailPage"));
const CinemaCreatePage = lazy(() => import("../pages/admin/cinemas/CinemaCreatePage"));
const CinemaEditPage = lazy(() => import("../pages/admin/cinemas/CinemaEditPage"));
const CinemaTrashPage = lazy(() => import("../pages/admin/cinemas/CinemaTrashPage"));

const RoomListPage = lazy(() => import("../pages/admin/rooms/RoomListPage"));
const RoomCreatePage = lazy(() => import("../pages/admin/rooms/RoomCreatePage"));
const RoomEditPage = lazy(() => import("../pages/admin/rooms/RoomEditPage"));
const RoomDetailPage = lazy(() => import("../pages/admin/rooms/RoomDetailPage"));
const RoomTrashPage = lazy(() => import("../pages/admin/rooms/RoomTrashPage"));

const ShowTimeListPage = lazy(() => import("../pages/admin/showtimes/ShowTimeListPage"));
const ShowTimeCreatePage = lazy(() => import("../pages/admin/showtimes/ShowTimeCreatePage"));
const ShowTimeEditPage = lazy(() => import("../pages/admin/showtimes/ShowTimeEditPage"));
const ShowTimeDetailPage = lazy(() => import("../pages/admin/showtimes/ShowTimeDetailPage"));
const ShowTimeTrashPage = lazy(() => import("../pages/admin/showtimes/ShowTimeTrashPage"));

const OrderListPage = lazy(() => import("../pages/admin/orders/OrderListPage"));
const OrderDetailPage = lazy(() => import("../pages/admin/orders/OrderDetailPage"));

const MemberListPage = lazy(() => import("../pages/admin/members/MemberListPage"));
const MemberDetailPage = lazy(() => import("../pages/admin/members/MemberDetailPage"));

const CommentListPage = lazy(() => import("../pages/admin/comments/CommentListPage"));

// Wrapper Suspense
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
            element: <LazyWrapper><DashBoardPage /></LazyWrapper>,
          },
          {
            path: "dashboard",
            element: <LazyWrapper><DashBoardPage /></LazyWrapper>,
          },

          // ── Films ────────────────────────────────────────────────────────────
          {
            path: "films",
            element: <LazyWrapper><FilmListPage /></LazyWrapper>,
          },
          {
            path: "films/trash",
            element: <LazyWrapper><FilmTrashPage /></LazyWrapper>,
          },
          {
            path: "films/create",
            element: <LazyWrapper><FilmCreatePage /></LazyWrapper>,
          },
          {
            path: "films/edit/:id",
            element: <LazyWrapper><FilmEditPage /></LazyWrapper>,
          },
          {
            path: "films/:id",
            element: <LazyWrapper><FilmDetailPage /></LazyWrapper>,
          },

          // ── Cinemas ──────────────────────────────────────────────────────────
          {
            path: "cinemas",
            element: <LazyWrapper><CinemaListPage /></LazyWrapper>,
          },
          {
            path: "cinemas/trash",
            element: <LazyWrapper><CinemaTrashPage /></LazyWrapper>,
          },
          {
            path: "cinemas/create",
            element: <LazyWrapper><CinemaCreatePage /></LazyWrapper>,
          },
          {
            path: "cinemas/edit/:id",
            element: <LazyWrapper><CinemaEditPage /></LazyWrapper>,
          },
          {
            path: "cinemas/:id",
            element: <LazyWrapper><CinemaDetailPage /></LazyWrapper>,
          },

          // ── Rooms ────────────────────────────────────────────────────────────
          {
            path: "rooms",
            element: <LazyWrapper><RoomListPage /></LazyWrapper>,
          },
          {
            path: "rooms/trash",
            element: <LazyWrapper><RoomTrashPage /></LazyWrapper>,
          },
          {
            path: "rooms/create",
            element: <LazyWrapper><RoomCreatePage /></LazyWrapper>,
          },
          {
            path: "rooms/edit/:id",
            element: <LazyWrapper><RoomEditPage /></LazyWrapper>,
          },
          {
            path: "rooms/:id",
            element: <LazyWrapper><RoomDetailPage /></LazyWrapper>,
          },

          // ── Show Times ───────────────────────────────────────────────────────
          {
            path: "show-times",
            element: <LazyWrapper><ShowTimeListPage /></LazyWrapper>,
          },
          {
            path: "show-times/trash",
            element: <LazyWrapper><ShowTimeTrashPage /></LazyWrapper>,
          },
          {
            path: "show-times/create",
            element: <LazyWrapper><ShowTimeCreatePage /></LazyWrapper>,
          },
          {
            path: "show-times/edit/:id",
            element: <LazyWrapper><ShowTimeEditPage /></LazyWrapper>,
          },
          {
            path: "show-times/:id",
            element: <LazyWrapper><ShowTimeDetailPage /></LazyWrapper>,
          },

          // ── Orders ───────────────────────────────────────────────────────────
          {
            path: "orders",
            element: <LazyWrapper><OrderListPage /></LazyWrapper>,
          },
          {
            path: "orders/:id",
            element: <LazyWrapper><OrderDetailPage /></LazyWrapper>,
          },

          // ── Members ──────────────────────────────────────────────────────────
          {
            path: "members",
            element: <LazyWrapper><MemberListPage /></LazyWrapper>,
          },
          {
            path: "members/:id",
            element: <LazyWrapper><MemberDetailPage /></LazyWrapper>,
          },

          // ── Comments ─────────────────────────────────────────────────────────
          {
            path: "comments",
            element: <LazyWrapper><CommentListPage /></LazyWrapper>,
          },
        ],
      },
    ],
  },
];

export default adminRoutes;