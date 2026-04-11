// src/pages/admin/cinemas/CinemaEditPage.jsx
import { useState, useEffect } from "react";
import { message, Spin } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import CinemaForm from "../../../components/Form/CinemaForm";
import { getCinemaById, updateCinema } from "../../../services/cinemaServices";
import ErrorDisplay from "../../../components/ErrorDisplay";

function CinemaEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [cinemaData, setCinemaData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch cinema data khi component mount
  useEffect(() => {
    const fetchCinemaData = async () => {
      try {
        setFetching(true);
        setError(null);
        const result = await getCinemaById(id);
        const dataCinema = result.data;
        setCinemaData(dataCinema);
        console.log('Cinema data:', result);
      } catch (err) {
        console.error("Error fetching cinema:", err);
        setError(err.response?.data?.message || "Không thể tải thông tin rạp chiếu");
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchCinemaData();
    } else {
      setError("Không tìm thấy ID rạp chiếu");
      setFetching(false);
    }
  }, [id]);

  const handleUpdateCinema = async (values) => {
    setLoading(true);
    try {
      console.log("Updating cinema with data:", values);
      
      const result = await updateCinema(id, values);
      if (result) {
        messageApi.open({
          type: "success",
          content: "Cập nhật rạp chiếu thành công",
          duration: 5,
        });
        
        // Redirect về danh sách sau khi update thành công
        setTimeout(() => {
          navigate("/admin/cinemas");
        }, 1500);
        
        return true; // Báo thành công cho CinemaForm
      } else {
        messageApi.open({
          type: "error",
          content: "Cập nhật rạp chiếu không thành công",
          duration: 5,
        });
        return false;
      }
    } catch (err) {
      console.error("Update cinema error:", err);
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể cập nhật rạp chiếu",
        duration: 5,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/cinemas");
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Hiển thị loading khi đang fetch data
  if (fetching) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Chỉnh sửa rạp chiếu</h1>
        <Spin
          size="large"
          tip="Đang tải thông tin rạp chiếu..."
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
        <h1>Chỉnh sửa rạp chiếu</h1>
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
              <h2>Đang tiến hành cập nhật rạp chiếu</h2>
            </>
          }
          size="large"
        >
          <h1>Chỉnh sửa rạp chiếu: {cinemaData?.name}</h1>
          <CinemaForm
            onFinish={handleUpdateCinema}
            onCancel={handleCancel}
            initialValues={cinemaData}
            submitButtonText="Cập nhật rạp chiếu"
          />
        </Spin>
      </div>
    </>
  );
}

export default CinemaEditPage;