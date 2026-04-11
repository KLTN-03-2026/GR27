import { useState } from "react";
import { message, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import RoomForm from "../../../components/Form/RoomForm";
import { createRoom } from "../../../services/roomServices";

function RoomCreatePage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (values) => {
    setLoading(true);
    try {
      
      
      const result = await createRoom(values);
      if (result) {
        messageApi.open({
          type: "success",
          content: "Tạo phòng chiếu mới thành công",
          duration: 5,
        });
        
        //Redirect về danh sách sau khi tạo thành công
        // setTimeout(() => {
        //   navigate("/admin/rooms");
        // }, 1500);
        
        return true; // Báo thành công cho RoomForm
      } else {
        messageApi.open({
          type: "error",
          content: "Tạo phòng chiếu mới không thành công",
          duration: 5,
        });
        return false; // Báo lỗi nhưng không reset form
      }
      
    } catch (err) {
      console.error("Create room error:", err);
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể tạo phòng chiếu",
        duration: 5,
      });
      return false; // Báo lỗi nhưng không reset form
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/rooms");
  };

  return (
    <>
      {contextHolder}
      <div style={{ padding: '20px' }}>
        <Spin
          spinning={loading}
          tip={
            <>
              <h2>Đang tiến hành tạo phòng chiếu</h2>
            </>
          }
          size="large"
        >
          <h1>Tạo Phòng Chiếu Mới</h1>
          <RoomForm
            onFinish={handleCreateRoom}
            onCancel={handleCancel}
            submitButtonText="Tạo phòng chiếu"
          />
        </Spin>
      </div>
    </>
  );
}

export default RoomCreatePage;