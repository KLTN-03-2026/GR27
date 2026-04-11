import React from 'react';
import { Layout, Input, Button, Dropdown, Space, Avatar } from 'antd';
import { SearchOutlined, DownOutlined, UserOutlined, LogoutOutlined, HistoryOutlined, ProfileOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './LayoutUser.scss';

const { Header: AntHeader } = Layout;

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const movieMenuItems = [
    {
      key: '1',
      label: <Link className='user-dropdown' to="/phim-dang-chieu">Phim đang chiếu</Link>,
    },
    {
      key: '2',
      label: <Link className='user-dropdown' to="/phim-sap-chieu">Phim sắp chiếu</Link>,
    }
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: <>
      <Link className='user-dropdown' to="/user">Quản lý Tài Khoản</Link>
      </>,
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: <Link className='user-dropdown' to="/my-tickets">Lịch sử mua vé</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: <Link className='user-dropdown' to="/auth/logout">Đăng Xuất</Link>,
    }
  ];

  const handleSearch = (value) => {
    const trimmedValue = value.trim();
    if (trimmedValue) {
      navigate(`/search?s=${encodeURIComponent(trimmedValue)}`);
    }
  };

  const renderUserSection = () => {
    if (isAuthenticated && user?.role === 'user') {
      return (
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          {/* MODIFIED: Replaced <a> with <Space> */}
          <Space className="user-avatar-link">
            <Avatar size="large" src={user.avatar} icon={<UserOutlined />} />
            <span className="user-name">{user.username}</span>
            <DownOutlined />
          </Space>
        </Dropdown>
      );
    }

    return (
      <>
        <Link to="/auth/login">
          <Button 
            type="default" 
            className="Layout-User__button Layout-User__button--login"
          >
            Đăng nhập
          </Button>
        </Link>
        <Link to="/auth/register">
          <Button 
            type="primary" 
            className="Layout-User__button Layout-User__button--register"
          >
            Đăng ký
          </Button>
        </Link>
      </>
    );
  };

  return (
    <AntHeader className="Layout-User__header">
      <div className="Layout-User__header-container">
        <div className="Layout-User__header-left">
          <Link to="/" className="Layout-User__logo">
            MOVIX
          </Link>
          
          <nav className="Layout-User__nav">
            <Dropdown menu={{ items: movieMenuItems }} trigger={['click']}>
              {/* MODIFIED: Replaced a > Space with just Space */}
              <Space className="Layout-User__nav-link">
                Phim
                <DownOutlined />
              </Space>
            </Dropdown>
            
            <Link to="/show-times" className="Layout-User__nav-link">
              Lịch chiếu
            </Link>
          </nav>
        </div>

        <div className="Layout-User__header-center">
            <Input
                className="Layout-User__search"
                placeholder="Tìm kiếm phim..."
                prefix={<SearchOutlined />}
                onPressEnter={(e) => handleSearch(e.target.value)}
                allowClear
            />
        </div>

        <div className="Layout-User__header-right">
          {renderUserSection()}
        </div>
      </div>
    </AntHeader>
  );
};

export default Header;