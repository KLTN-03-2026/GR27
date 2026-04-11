import { useState, useEffect } from "react";
import { message, Spin } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import ShowTimeForm from "../../../components/Form/ShowTimeForm";
import { getShowTimeById, updateShowTime } from "../../../services/showTimeServices";
import ErrorDisplay from "../../../components/ErrorDisplay";

function ShowTimeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showTimeData, setShowTimeData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch showtime data khi component mount
  useEffect(() => {
    const fetchShowTimeData = async () => {
      try {
        setFetching(true);
        setError(null);
        const result = await getShowTimeById(id);
        const dataShowTime = result.data;
        setShowTimeData(dataShowTime);
        console.log('ShowTime data:', result);
      } catch (err) {
        console.error("Error fetching showtime:", err);
        setError(err.response?.data?.message || "Không thể tải thông tin suất chiếu");
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchShowTimeData();
    } else {
      setError("Không tìm thấy ID suất chiếu");
      setFetching(false);
    }
  }, [id]);

  const handleUpdateShowTime = async (values) => {
    setLoading(true);
    try {
      console.log("Updating showtime with data:", values);
      
      const result = await updateShowTime(id, values);
      if (result) {
        messageApi.open({
          type: "success",
          content: "Cập nhật suất chiếu thành công",
          duration: 5,
        });
        
        // Redirect về danh sách sau khi update thành công
        setTimeout(() => {
          navigate("/admin/show-times");
        }, 1500);
        
        return true;
      } else {
        messageApi.open({
          type: "error",
          content: "Cập nhật suất chiếu không thành công",
          duration: 5,
        });
        return false;
      }
    } catch (err) {
      console.error("Update showtime error:", err);
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể cập nhật suất chiếu",
        duration: 5,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/show-times");
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Hiển thị loading khi đang fetch data
  if (fetching) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Chỉnh sửa suất chiếu</h1>
        <Spin
          size="large"
          tip="Đang tải thông tin suất chiếu..."
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
        <h1>Chỉnh sửa suất chiếu</h1>
        <ErrorDisplay 
          message={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Render title với thông tin phim
  const renderTitle = () => {
    if (!showTimeData) return "Chỉnh sửa suất chiếu";
    
    const filmTitle = typeof showTimeData.filmId === 'object' 
      ? showTimeData.filmId.title 
      : 'N/A';
    const cinemaName = typeof showTimeData.cinemaId === 'object'
      ? showTimeData.cinemaId.name
      : 'N/A';
    
    return `Chỉnh sửa: ${filmTitle} - ${cinemaName}`;
  };

  // Hiển thị form khi đã có data
  return (
    <>
      {contextHolder}
      <div style={{ padding: '20px' }}>
        <Spin
          spinning={loading}
          tip={
            <>
              <h2>Đang tiến hành cập nhật suất chiếu</h2>
            </>
          }
          size="large"
        >
          <h1>{renderTitle()}</h1>
          <ShowTimeForm
            onFinish={handleUpdateShowTime}
            onCancel={handleCancel}
            initialValues={showTimeData}
            submitButtonText="Cập nhật suất chiếu"
            isEditMode={true} // Flag để form biết đang edit
          />
        </Spin>
      </div>
    </>
  );
}

export default ShowTimeEditPage;