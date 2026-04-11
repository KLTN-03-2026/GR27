import { Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  VideoCameraOutlined,
  ShopOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  UserOutlined,
  CommentOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";

const MenuSider = () => {
  const location = useLocation();

  const items = [
    {
      label: <Link to="/admin/dashboard">Dashboard</Link>,
      icon: <DashboardOutlined />,
      key: "/admin/dashboard",
    },
    {
      label: <Link to="/admin/films">Quản lý phim</Link>,
      icon: <VideoCameraOutlined />,
      key: "/admin/films",
    },
    {
      label: <Link to="/admin/cinemas">Quản lý rạp chiếu</Link>,
      icon: <ShopOutlined />,
      key: "/admin/cinemas",
    },
    {
      label: <Link to="/admin/rooms">Quản lý phòng chiếu</Link>,
      icon: <AppstoreOutlined />,
      key: "/admin/rooms",
    },
    {
      label: <Link to="/admin/show-times">Quản lý suất chiếu</Link>,
      icon: <CalendarOutlined />,
      key: "/admin/show-times",
    },
    {
      label: <Link to="/admin/members">Quản lý thành viên</Link>,
      icon: <UserOutlined />,
      key: "/admin/members",
    },
    {
      label: <Link to="/admin/comments">Quản lý bình luận</Link>,
      icon: <CommentOutlined />,
      key: "/admin/comments",
    },
    {
      label: <Link to="/admin/orders">Quản lý đặt vé</Link>,
      icon: <ShoppingCartOutlined />,
      key: "/admin/orders",
    },
     {
      label: <Link to="/admin/promotions">Quản lý khuyến mãi</Link>,
      icon: <GiftOutlined />,
      key: "/admin/promotions",
    },
  ];

  return (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={items}
    />
  );
};

export default MenuSider;
