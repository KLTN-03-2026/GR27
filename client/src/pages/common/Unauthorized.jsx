// src/pages/common/Unauthorized.jsx (403 Page)
import React from 'react';
import { Result, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { HomeOutlined, LoginOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Nút action khác nhau tùy trạng thái user
  const getExtraButtons = () => {
    if (!isAuthenticated) {
      // Chưa đăng nhập
      return [
        <Button type="primary" key="login" icon={<LoginOutlined />}>
          <Link to="/admin/auth/login">Đăng nhập</Link>
        </Button>,
        <Button key="home" icon={<HomeOutlined />}>
          <Link to="/">Về trang chủ</Link>
        </Button>
      ];
    }

    // Đã đăng nhập nhưng không đủ quyền
    const homeRoute = user?.role === 'admin' ? '/admin/dashboard' : '/';
    
    return [
      <Button type="primary" key="home" icon={<HomeOutlined />}>
        <Link to={homeRoute}>Về trang chính</Link>
      </Button>,
      <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
        Quay lại
      </Button>
    ];
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <Result
        status="403"
        title="403"
        subTitle={
          !isAuthenticated 
            ? "Bạn cần đăng nhập để truy cập trang này." 
            : "Xin lỗi, bạn không có quyền truy cập trang này."
        }
        extra={getExtraButtons()}
      />
    </div>
  );
};

export default Unauthorized;