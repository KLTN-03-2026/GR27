// src/pages/user/payment/PaymentCancelPage.jsx
import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';

const PaymentCancelPage = () => {
  return (
    <Result
      status="warning"
      title="Giao dịch đã bị hủy"
      subTitle="Bạn đã hủy thanh toán. Vui lòng thử lại nếu bạn vẫn muốn đặt vé."
      extra={[
        <Button type="primary" key="console">
          <Link to="/">Về trang chủ</Link>
        </Button>,
      ]}
    />
  );
};

export default PaymentCancelPage;