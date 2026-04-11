import { useState, useEffect } from "react";
import { message, Spin } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import FilmForm from "../../../components/Form/FilmForm";
import { getFilmById, updateFilm } from "../../../services/filmServices";
import ErrorDisplay from "../../../components/ErrorDisplay";

function FilmEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [filmData, setFilmData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch film data khi component mount
  useEffect(() => {
    const fetchFilmData = async () => {
      try {
        setFetching(true);
        setError(null);
        const result = await getFilmById(id);
        const dataFilm = result.data;
        setFilmData(dataFilm);
        console.log('result', result);
      } catch (err) {
        console.error("Error fetching film:", err);
        setError(err.response?.data?.message || "Không thể tải thông tin phim");
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchFilmData();
    } else {
      setError("Không tìm thấy ID phim");
      setFetching(false);
    }
  }, [id]);

  const handleUpdateFilm = async (values) => {
    setLoading(true);
    try {
      const result = await updateFilm(id, values);
      if (result) {
        messageApi.open({
          type: "success",
          content: "Cập nhật phim thành công",
          duration: 5,
        });
        
        // Redirect về danh sách sau khi update thành công
        setTimeout(() => {
          navigate("/admin/films");
        }, 1500);
        
        return true; // Báo thành công cho FilmForm
      } else {
        messageApi.open({
          type: "error",
          content: "Cập nhật phim không thành công",
          duration: 5,
        });
        return false;
      }
    } catch (err) {
      console.error("Update film error:", err);
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể cập nhật phim",
        duration: 5,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/films");
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Hiển thị loading khi đang fetch data
  if (fetching) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Chỉnh sửa phim</h1>
        <Spin
          size="large"
          tip="Đang tải thông tin phim..."
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
        <h1>Chỉnh sửa phim</h1>
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
              <h2>Đang tiến hành cập nhật phim</h2>
            </>
          }
          size="large"
        >
          <h1>Chỉnh sửa phim: {filmData?.title}</h1>
          <FilmForm
            onFinish={handleUpdateFilm}
            onCancel={handleCancel}
            initialValues={filmData}
            submitButtonText="Cập nhật phim"
          />
        </Spin>
      </div>
    </>
  );
}

export default FilmEditPage;