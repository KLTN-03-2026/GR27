// src/components/BookingModal/index.jsx

import React, { useState, useEffect, useMemo } from "react";
import { Modal, Steps, Button, message, Spin, Result } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import SeatSelection from "./SeatSelection";
import ComboSelection from "./ComboSelection";
import Confirmation from "./Confirmation";
import QRCodePayment from "./QRCodePayment";
import {
  createOrder,
  checkPaymentStatus,
  cancelOrder,
} from "../../services/orderServices";
import "./Booking.scss";

const BookingModal = ({ showtime, open, onClose }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Kiểm tra phiên đăng nhập

  // Gộp các state liên quan đến order và payment vào một object
  const [orderInfo, setOrderInfo] = useState({
    orderId: null,
    paymentData: null,
    pollingStatus: "idle", // idle, processing, success, error
  });

  // Reset tất cả state khi modal được mở lại
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setSelectedSeats([]);
      setSelectedCombos([]);
      setOrderInfo({
        orderId: null,
        paymentData: null,
        pollingStatus: "idle",
      });
    }
  }, [open]);

  // Logic polling
  useEffect(() => {
    // Chỉ chạy polling khi có đầy đủ thông tin và đang ở đúng trạng thái
    if (orderInfo.pollingStatus !== "processing" || !orderInfo.orderId) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 10000; // Poll trong 20000 giây (10000 * 2s)

    const pollInterval = setInterval(async () => {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        setOrderInfo((prev) => ({ ...prev, pollingStatus: "error" }));
        messageApi.warning(
          "Quá thời gian thanh toán. Vui lòng hủy và thử lại."
        );
        return;
      }

      try {
        const res = await checkPaymentStatus(orderInfo.orderId);
        if (res.data.paymentStatus === "paid") {
          clearInterval(pollInterval);
          setOrderInfo((prev) => ({ ...prev, pollingStatus: "success" }));
          messageApi.success(
            "Thanh toán thành công! Đang chuyển đến trang vé..."
          );
          setTimeout(() => {
            onClose(); // Đóng modal
            navigate(`/ticket/${orderInfo.orderId}`);
          }, 2000);
        }
      } catch (err) {
        console.error("Polling error:", err);
        if (err.response?.status === 404) {
          clearInterval(pollInterval);
          setOrderInfo((prev) => ({ ...prev, pollingStatus: "error" }));
          messageApi.error("Không tìm thấy đơn hàng để kiểm tra.");
        }
      }
    }, 2000); // Poll mỗi 2 giây

    // Cleanup khi component unmount hoặc state thay đổi
    return () => {
      clearInterval(pollInterval);
    };
  }, [orderInfo, navigate, onClose, messageApi]);

  const seatSubtotal = useMemo(
    () => selectedSeats.reduce((total, seat) => total + seat.price, 0),
    [selectedSeats]
  );
  const comboSubtotal = useMemo(
    () =>
      selectedCombos.reduce(
        (total, combo) => total + combo.price * combo.quantity,
        0
      ),
    [selectedCombos]
  );
  const totalPrice = seatSubtotal + comboSubtotal;

  const handleNext = () => setCurrentStep(currentStep + 1);
  const handlePrev = () => setCurrentStep(currentStep - 1);

  const handleCreateOrder = async () => {
    if (!isAuthenticated || user?.role === "admin") {
      messageApi.warning(
        "Vui lòng đăng nhập bằng tài khoản người dùng để đặt vé."
      );
      setTimeout(() => {
        onClose();
      navigate("/auth/login");
      }, 2000);
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        showtimeId: showtime._id,
        seats: selectedSeats.map((s) => ({
          seatKey: s.seatKey,
          type: s.type,
          unitPrice: s.price,
        })),
        comboFoods: selectedCombos.map((c) => ({
          comboFoodId: c.comboFoodId,
          name: c.name,
          price: c.price,
          quantity: c.quantity,
        })),
      };

      const response = await createOrder(payload);

      if (response.code === 201 && response.data.paymentData) {
        // Cập nhật tất cả state liên quan trong một lần
        setOrderInfo({
          orderId: response.data.orderId,
          paymentData: response.data.paymentData,
          pollingStatus: "processing", // Bắt đầu polling
        });
        handleNext(); // Chuyển sang bước hiển thị QR
      } else {
        throw new Error("Không thể tạo thông tin thanh toán.");
      }
    } catch (err) {
      messageApi.error(
        err.response?.data?.message || "Đặt vé thất bại, vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderInfo.orderId) {
      onClose();
      return;
    }

    const key = "cancellingOrder";
    messageApi.open({
      key,
      type: "loading",
      content: "Đang hủy giao dịch...",
    });

    try {
      await cancelOrder(orderInfo.orderId);

      messageApi.success({
        key,
        content: "Đã hủy giao dịch thành công!",
        duration: 2,
      });
    } catch (err) {
      console.error("Cancel order error:", err);
      messageApi.error({
        key,
        content:
          err.response?.data?.message ||
          "Không thể hủy giao dịch, vui lòng thử lại.",
        duration: 3,
      });
    } finally {
      onClose();
    }
  };

  const steps = [
    {
      title: "Chọn ghế",
      content: (
        <SeatSelection
          showtime={showtime}
          selectedSeats={selectedSeats}
          onSelect={setSelectedSeats}
        />
      ),
    },
    {
      title: "Chọn combo",
      content: (
        <ComboSelection
          selectedCombos={selectedCombos}
          onSelect={setSelectedCombos}
        />
      ),
    },
    {
      title: "Xác nhận",
      content: (
        <Confirmation
          film={showtime?.filmId}
          showtime={showtime}
          selectedSeats={selectedSeats}
          selectedCombos={selectedCombos}
          totalPrice={totalPrice}
          user={user}
        />
      ),
    },
    {
      title: "Thanh toán",
      content: (
        <>
          {orderInfo.pollingStatus === "processing" && (
            <QRCodePayment
              paymentData={orderInfo.paymentData}
              onCancel={handleCancelOrder}
            />
          )}
          {orderInfo.pollingStatus === "success" && (
            <Result
              status="success"
              title="Thanh toán thành công!"
              subTitle="Đang chuẩn bị vé của bạn..."
            />
          )}
          {orderInfo.pollingStatus === "error" && (
            <Result
              status="error"
              title="Giao dịch thất bại"
              subTitle="Đã có lỗi xảy ra hoặc giao dịch hết hạn. Vui lòng thử lại."
            />
          )}
          {(orderInfo.pollingStatus === "idle" || isLoading) && (
            <Spin tip="Đang tạo mã thanh toán..." size="large" />
          )}
        </>
      ),
    },
  ];

  const canProceed = () =>
    currentStep === 0 && selectedSeats.length === 0 ? false : true;

  return (
    <>
      {contextHolder}
      <Modal
        title={
          currentStep < 3
            ? `Đặt vé: ${showtime?.filmId?.title}`
            : "Thanh toán đơn hàng"
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={currentStep === 0 ? 1000 : currentStep === 3 ? 900 : 800}
        className="booking-modal"
        maskClosable={false}
      >
        <div className="booking-steps-container">
          <Steps
            current={currentStep}
            items={steps.map((s) => ({ title: s.title }))}
          />
        </div>

        <div className="booking-steps-content">
          {steps[currentStep].content}
        </div>

        {currentStep < 3 && (
          <div className="booking-steps-action">
            <div className="total-price">
              Tổng cộng: {totalPrice.toLocaleString("vi-VN")} đ
            </div>
            <div className="action-buttons">
              {currentStep > 0 && (
                <Button style={{ margin: "0 8px" }} onClick={handlePrev}>
                  Quay lại
                </Button>
              )}
              {currentStep < 2 && (
                <Button
                  type="primary"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Tiếp tục
                </Button>
              )}
              {currentStep === 2 && (
                <Button
                  type="primary"
                  loading={isLoading}
                  onClick={handleCreateOrder}
                >
                  Xác nhận & Thanh toán
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default BookingModal;
