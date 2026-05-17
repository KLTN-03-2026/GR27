import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Spin, message } from 'antd';
import { checkPaymentStatus } from '../../../services/orderServices';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (!orderId) {
      setStatus('error');
      messageApi.error('Không tìm thấy thông tin đơn hàng.');
      return;
    }

    let attempts = 0;
    const maxAttempts = 15; // Poll trong 30 giây (15 * 2s)

    const pollPaymentStatus = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(pollPaymentStatus);
        setStatus('error');
        messageApi.warning('Không thể xác nhận thanh toán tự động. Vui lòng kiểm tra trong lịch sử đặt vé.');
        return;
      }
      
      try {
        const res = await checkPaymentStatus(orderId);
        if (res.data.paymentStatus === 'paid') {
          clearInterval(pollPaymentStatus);
          setStatus('success');
          // Chuyển hướng đến trang vé sau 2 giây
          setTimeout(() => {
            navigate(`/ticket/${orderId}`);
          }, 2000);
        } else if (res.data.paymentStatus === 'failed') {
          clearInterval(pollPaymentStatus);
          setStatus('error');
          messageApi.error('Thanh toán thất bại hoặc đã bị hủy.');
        }
        // Nếu vẫn là pending, tiếp tục poll
      } catch (err) {
        console.error('Polling error:', err);
        // Có thể tiếp tục poll hoặc dừng lại nếu lỗi nghiêm trọng
      }
    }, 2000); // Poll mỗi 2 giây

    // Cleanup interval on unmount
    return () => clearInterval(pollPaymentStatus);
  }, [searchParams, navigate, messageApi]);

  if (status === 'processing') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin tip="Đang xác nhận thanh toán, vui lòng không rời khỏi trang..." size="large" />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <Result
        status="success"
        title="Thanh toán thành công!"
        subTitle="Đơn hàng của bạn đã được xác nhận. Đang chuyển đến trang vé của bạn..."
      />
    );
  }

  return (
    <>
    {contextHolder }
    <Result
      status="error"
      title="Thanh toán không thành công"
      subTitle="Đã có lỗi xảy ra trong quá trình xử lý thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ."
    />
    </>
  );
};

export default PaymentSuccessPage;