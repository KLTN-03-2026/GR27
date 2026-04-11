// src/pages/common/NotFound.jsx (404 Page)
import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const NotFound = () => {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <Result
        status="404"
        title="404"
        subTitle="Xin lỗi, trang bạn tìm kiếm không tồn tại."
        extra={[
          <Button type="primary" key="home" icon={<HomeOutlined />}>
            <Link to="/">Về trang chủ</Link>
          </Button>,
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
            Quay lại
          </Button>
        ]}
      />
    </div>
  );
};

export default NotFound;