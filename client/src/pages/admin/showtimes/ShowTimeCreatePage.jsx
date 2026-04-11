import { useState } from "react";
import { message, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import ShowTimeForm from "../../../components/Form/ShowTimeForm";
import { createShowTime } from "../../../services/showTimeServices";

function ShowTimeCreatePage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const handleCreateShowTime = async (values) => {
    setLoading(true);
    try {
      console.log("Creating showtime with data:", values);
      
      const result = await createShowTime(values);
      if (result) {
        messageApi.open({
          type: "success",
          content: "Tạo suất chiếu mới thành công",
          duration: 5,
        });
        
        // Redirect về danh sách sau khi tạo thành công
        // setTimeout(() => {
        //   navigate("/admin/show-times");
        // }, 1500);
        
        return true; // Báo thành công cho ShowTimeForm
      } else {
        messageApi.open({
          type: "error",
          content: "Tạo suất chiếu mới không thành công",
          duration: 5,
        });
        return false; // Báo lỗi nhưng không reset form
      }
    } catch (err) {
      console.error("Create showtime error:", err);
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể tạo suất chiếu",
        duration: 5,
      });
      return false; // Báo lỗi nhưng không reset form
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/show-times");
  };

  return (
    <>
      {contextHolder}
      <div style={{ padding: '20px' }}>
        <Spin
          spinning={loading}
          tip={
            <>
              <h2>Đang tiến hành tạo suất chiếu</h2>
            </>
          }
          size="large"
        >
          <h1>Tạo Suất Chiếu Mới</h1>
          <ShowTimeForm
            onFinish={handleCreateShowTime}
            onCancel={handleCancel}
            submitButtonText="Tạo suất chiếu"
          />
        </Spin>
      </div>
    </>
  );
}

export default ShowTimeCreatePage;