// src/pages/admin/cinemas/CinemaCreatePage.jsx
import { useState } from "react";
import { message, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import CinemaForm from "../../../components/Form/CinemaForm";
import { createCinema } from "../../../services/cinemaServices";

function CinemaCreatePage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const handleCreateCinema = async (values) => {
    setLoading(true);
    try {
      console.log("Creating cinema with data:", values);
      
      const result = await createCinema(values);
      if (result) {
        messageApi.open({
          type: "success",
          content: "Tạo rạp chiếu mới thành công",
          duration: 5,
        });
        
        // Redirect về danh sách sau khi tạo thành công
        setTimeout(() => {
          navigate("/admin/cinemas");
        }, 1500);
        
        return true; // Báo thành công cho CinemaForm
      } else {
        messageApi.open({
          type: "error",
          content: "Tạo rạp chiếu mới không thành công",
          duration: 5,
        });
        return false; // Báo lỗi nhưng không reset form
      }
    } catch (err) {
      console.error("Create cinema error:", err);
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể tạo rạp chiếu",
        duration: 5,
      });
      return false; // Báo lỗi nhưng không reset form
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/cinemas");
  };

  return (
    <>
      {contextHolder}
      <div style={{ padding: '20px' }}>
        <Spin
          spinning={loading}
          tip={
            <>
              <h2>Đang tiến hành tạo rạp chiếu</h2>
            </>
          }
          size="large"
        >
          <h1>Tạo Rạp Chiếu Mới</h1>
          <CinemaForm
            onFinish={handleCreateCinema}
            onCancel={handleCancel}
            submitButtonText="Tạo rạp chiếu"
          />
        </Spin>
      </div>
    </>
  );
}

export default CinemaCreatePage;