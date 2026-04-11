import { Button, Layout } from "antd";
import { useState } from "react";
import {
  HomeOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, Outlet } from "react-router-dom";
import MenuSider from "../../components/MenuSider";
import "./LayoutAdmin.scss"
const { Sider, Content } = Layout;

function LayoutAdmin() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Layout className="layout-admin">
        <header className="header">
          <div
            className={
              "header__logoAdmin " + (collapsed && "header__logoAdmin--collapsed")
            }
          >
            {collapsed ? "MV" : "MV Admin"}
          </div>
          <div className="header__nav">
            <div className="header__nav--left">
              <div
                className="header__collapse"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </div>
            </div>
            <div className="header__nav--right">
              <Link to="/">
                <Button icon={<HomeOutlined />} size="large" className="button">
                  Trang chủ
                </Button>
                
              </Link>
              <Link to="/auth/logout">
                <Button
                  icon={<LogoutOutlined />}
                  size="large"
                  className="button"
                >
                  Đăng xuất
                </Button>
              </Link>
            </div>
          </div>
        </header>
        <Layout>
          <Sider className="sider" collapsed={collapsed} width={250} theme="light">
            <MenuSider  />
          </Sider>
          <Content className="content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </>
  );
}

export default LayoutAdmin;
