import { useState, useEffect } from "react";
import { message, Spin } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import RoomForm from "../../../components/Form/RoomForm";
import { getRoomById, updateRoom } from "../../../services/roomServices";
import ErrorDisplay from "../../../components/ErrorDisplay";

function RoomEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch room data khi component mount
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setFetching(true);
        setError(null);
        const result = await getRoomById(id);
        const dataRoom = result.data;
        setRoomData(dataRoom);
        console.log('Room data:', result);
      } catch (err) {
        console.error("Error fetching room:", err);
        setError(err.response?.data?.message || "Không thể tải thông tin phòng chiếu");
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchRoomData();
    } else {
      setError("Không tìm thấy ID phòng chiếu");
      setFetching(false);
    }
  }, [id]);

  const handleUpdateRoom = async (values) => {
    setLoading(true);
    try {
      console.log("Updating room with data:", values);
      
      const result = await updateRoom(id, values);
      if (result) {
        messageApi.open({
          type: "success",
          content: "Cập nhật phòng chiếu thành công",
          duration: 5,
        });
        
        // Redirect về danh sách sau khi update thành công
        setTimeout(() => {
          navigate("/admin/rooms");
        }, 1500);
        
        return true; // Báo thành công cho RoomForm
      } else {
        messageApi.open({
          type: "error",
          content: "Cập nhật phòng chiếu không thành công",
          duration: 5,
        });
        return false;
      }
    } catch (err) {
      console.error("Update room error:", err);
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể cập nhật phòng chiếu",
        duration: 5,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/rooms");
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Hiển thị loading khi đang fetch data
  if (fetching) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Chỉnh sửa phòng chiếu</h1>
        <Spin
          size="large"
          tip="Đang tải thông tin phòng chiếu..."
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px'
          }}
        >
          <div style={{ minHeight: 400, minWidth: 400 }} />
        </Spin>
      </div>
    );
  }

  // Hiển thị lỗi nếu không tải được data
  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Chỉnh sửa phòng chiếu</h1>
        <ErrorDisplay 
          message={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Hiển thị form khi đã có data
  return (
    <>
      {contextHolder}
      <div style={{ padding: '20px' }}>
        <Spin
          spinning={loading}
          tip={
            <>
              <h2>Đang tiến hành cập nhật phòng chiếu</h2>
            </>
          }
          size="large"
        >
          <h1>Chỉnh sửa phòng chiếu: {roomData?.name}</h1>
          <RoomForm
            onFinish={handleUpdateRoom}
            onCancel={handleCancel}
            initialValues={roomData}
            submitButtonText="Cập nhật phòng chiếu"
          />
        </Spin>
      </div>
    </>
  );
}

export default RoomEditPage;