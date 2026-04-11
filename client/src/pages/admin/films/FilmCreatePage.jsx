import { useState } from "react";
import { message, Spin } from "antd";
import FilmForm from "../../../components/Form/FilmForm";
import { createFilm } from "../../../services/filmServices";

function FilmCreatePage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const handleCreateFilm = async (values) => {
    setLoading(true);
    try {
      const result = await createFilm(values);
      if (result) {
        messageApi.open({
          type: "success",
          content: "Tạo phim mới thành công",
          duration: 5,
        });
        return true; // Báo thành công cho FilmForm
      } else {
        messageApi.open({
          type: "error",
          content: "Tạo phim mới không thành công",
          duration: 5,
        });
        return false; // Báo lỗi nhưng không reset form
      }
    } catch (err) {
      messageApi.open({
        type: "error",
        content: err.response?.data?.message || "Không thể tạo phim",
      });
      return false; // Báo lỗi nhưng không reset form
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log("Cancel clicked");
  };

  return (
    <>
      {contextHolder}
      <Spin
        spinning={loading}
         
        tip={
          <>
            <h2>Đang tiến hành lưu phim</h2>
          </>
        }
        size="large"
      >
        <h1>Tạo Phim Mới</h1>
        <FilmForm
          onFinish={handleCreateFilm}
          onCancel={handleCancel}
          submitButtonText="Tạo phim"
        />
      </Spin>
    </>
  );
}

export default FilmCreatePage;