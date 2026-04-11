import {
  Button,
  Col,
  Form,
  Image,
  Input,
  Row,
  Select,
  Switch,
  Upload,
  DatePicker,
  InputNumber,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import { useEffect, useState, useRef } from "react";
import { getCategories } from "../../services/categoryServices";
import useImageUpload from "../../hooks/useImageUpload";
import dayjs from "dayjs";
import { DEFAULT_IMAGES } from "../../constants";

const { TextArea } = Input;

function FilmForm({
  onFinish,
  onCancel,
  initialValues,
  submitButtonText = "Cập nhật",
}) {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const initialValuesSetRef = useRef(false);

  // Sử dụng useImageUpload hook
  const {
    fileList,
    previewOpen,
    previewImage,
    uploading,
    setPreviewOpen,
    setInitialImage,
    getFinalImageUrl,
    resetAll,
    uploadProps,
  } = useImageUpload({
    defaultImage: DEFAULT_IMAGES.FILM_POSTER,
    maxCount: 1,
    onUploadSuccess: (url) => console.log("Upload thành công:", url),
    onUploadError: (error) => console.error("Upload lỗi:", error),
  });

  // Fetch categories từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await getCategories();
        const categoryListSelect = result.map((item) => ({
          label: item.title,
          value: item._id,
        }));
        setCategories(categoryListSelect);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Set initial values chỉ một lần khi có dữ liệu từ props
  useEffect(() => {
    if (initialValues && !initialValuesSetRef.current) {
      // Convert arrays thành string để hiển thị trong Input
      const formattedValues = { ...initialValues };

      // Convert arrays thành string với dấu phẩy
      if (Array.isArray(initialValues.otherTitles)) {
        formattedValues.otherTitles = initialValues.otherTitles.join(", ");
      }

      if (Array.isArray(initialValues.actors)) {
        formattedValues.actors = initialValues.actors.join(", ");
      }

      if (Array.isArray(initialValues.directors)) {
        formattedValues.directors = initialValues.directors.join(", ");
      }

      // Convert categoryIds từ object -> array string
      if (Array.isArray(initialValues.categoryIds)) {
        formattedValues.categoryIds = initialValues.categoryIds.map(
          (c) => c._id
        );
      }

      // Set initial image using hook
      if (initialValues.thumbnail) {
        setInitialImage(initialValues.thumbnail);
      }

      // Set form values
      form.setFieldsValue({
        ...formattedValues,
        releaseDate: initialValues.releaseDate
          ? dayjs(initialValues.releaseDate)
          : null,
      });

      initialValuesSetRef.current = true; // Đánh dấu đã set xong
    }
  }, [initialValues, form, setInitialImage]);

  // Reset flag khi initialValues thay đổi
  useEffect(() => {
    initialValuesSetRef.current = false;
  }, [initialValues]);

  const handleFinish = async (values) => {
    console.log("Form values before processing:", values);
    try {
      // Xử lý thumbnail bằng hook
      const thumbnailUrl = await getFinalImageUrl(initialValues?.thumbnail);
      values.thumbnail = thumbnailUrl;

      // Convert string thành array cho otherTitles, actors, directors
      if (values.otherTitles) {
        values.otherTitles = values.otherTitles
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "");
      } else {
        values.otherTitles = [];
      }

      if (values.actors) {
        values.actors = values.actors
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "");
      } else {
        values.actors = [];
      }

      if (values.directors) {
        values.directors = values.directors
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "");
      } else {
        values.directors = [];
      }

      // ✅ Fix: Xử lý status đúng cách
      // Nếu values.status là boolean thì convert sang string
      if (typeof values.status === 'boolean') {
        values.status = values.status ? "active" : "inactive";
      }
      // Nếu đã là string thì giữ nguyên

      // Format releaseDate thành MongoDB Date
      if (values.releaseDate) {
        values.releaseDate = values.releaseDate.toDate();
      }

      console.log("Values after processing:", values);
      const result = await onFinish(values);

      // Chỉ reset form khi onFinish return true (thành công)
      if (result === true) {
        form.resetFields();
        resetAll();
        initialValuesSetRef.current = false;
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // ✅ Fix: Tạo initialValues đúng cách
  const getInitialFormValues = () => {
    const defaultValues = {
      status: "inactive", // ✅ Mặc định inactive cho form mới
      isTrending: false,
      availableFormats: [],
    };

    // Nếu có initialValues (đang edit), ưu tiên initialValues
    if (initialValues) {
      return {
        ...defaultValues,
        ...initialValues,
        releaseDate: initialValues.releaseDate ? dayjs(initialValues.releaseDate) : null,
      };
    }

    return defaultValues;
  };

  return (
    <Form
      form={form}
      onFinish={handleFinish}
      initialValues={getInitialFormValues()}
      layout="vertical"
    >
      <Row gutter={[20, 5]}>
        <Col span={24}>
          <Form.Item
            name="title"
            label="Tên phim"
            rules={[{ required: true, message: "Vui lòng nhập tên phim" }]}
          >
            <Input type="text" />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="otherTitles"
            label="Tên khác"
            tooltip="Nhập các tên khác, cách nhau bằng dấu phẩy"
          >
            <Input placeholder="Ví dụ: Tên tiếng Anh, Tên tiếng Hàn, Tên khác..." />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="categoryIds"
            label="Thể loại"
            rules={[{ required: true, message: "Vui lòng chọn thể loại" }]}
          >
            <Select
              mode="multiple"
              allowClear
              key={categories.value}
              placeholder="Chọn thể loại"
              options={categories}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="availableFormats"
            label="Định dạng chiếu"
            rules={[
              { required: true, message: "Vui lòng chọn định dạng chiếu" },
            ]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Chọn định dạng chiếu"
              options={[
                { value: "2D", label: "2D" },
                { value: "3D", label: "3D" },
                { value: "IMAX", label: "IMAX" },
              ]}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="actors"
            label="Diễn viên"
            rules={[
              { required: true, message: "Vui lòng nhập ít nhất 1 diễn viên" },
            ]}
            tooltip="Nhập tên các diễn viên, cách nhau bằng dấu phẩy"
          >
            <Input placeholder="Ví dụ: Ngô Thanh Vân, Trấn Thành, Kiều Minh Tuấn..." />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="directors"
            label="Đạo diễn"
            tooltip="Nhập tên các đạo diễn, cách nhau bằng dấu phẩy"
            rules={[
              { required: true, message: "Vui lòng nhập ít nhất 1 đạo diễn" },
            ]}
          >
            <Input placeholder="Ví dụ: Lý Hải, Victor Vũ, Dustin Nguyễn..." />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="releaseDate"
            label="Ngày phát hành"
            rules={[
              { required: true, message: "Vui lòng chọn ngày phát hành" },
            ]}
          >
            <DatePicker
              style={{ width: "100%" }}
              placeholder="Chọn ngày phát hành"
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="duration"
            label="Thời lượng (phút)"
            rules={[
              { required: true, message: "Vui lòng nhập thời lượng phim" },
            ]}
          >
            <InputNumber
              min={1}
              placeholder="Nhập thời lượng"
              style={{ width: "100%" }}
              addonAfter="phút"
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="ageRating"
            label="Độ tuổi phù hợp"
            rules={[
              { required: true, message: "Vui lòng chọn độ tuổi phù hợp" },
            ]}
          >
            <Select
              placeholder="Chọn độ tuổi phù hợp"
              options={[
                { value: "P", label: "P - Phim dành cho mọi lứa tuổi" },
                { value: "K", label: "K - Phim dành cho trẻ em dưới 13 tuổi" },
                {
                  value: "T13",
                  label: "T13 - Phim dành cho khán giả từ 13 tuổi trở lên",
                },
                {
                  value: "T16",
                  label: "T16 - Phim dành cho khán giả từ 16 tuổi trở lên",
                },
                {
                  value: "T18",
                  label: "T18 - Phim dành cho khán giả từ 18 tuổi trở lên",
                },
                { value: "C", label: "C - Phim cấm chiếu" },
              ]}
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="filmLanguage"
            label="Ngôn ngữ"
            rules={[{ required: true, message: "Vui lòng nhập ngôn ngữ" }]}
          >
            <Input placeholder="Ví dụ: Tiếng Việt, English, 한국어" />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item name="subtitles" label="Phụ đề">
            <Input placeholder="Ví dụ: Tiếng Việt, English" />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="trailer"
            label="Link Trailer"
            rules={[
              {
                type: "url",
                message: "Vui lòng nhập URL hợp lệ",
              },
            ]}
          >
            <Input placeholder="https://www.youtube.com/watch?v=..." />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            name="description"
            label="Mô tả phim"
            rules={[{ required: true, message: "Vui lòng nhập mô tả phim" }]}
          >
            <TextArea rows={6} placeholder="Nhập mô tả chi tiết về phim" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="Upload Poster"
            name="thumbnail"
            valuePropName="fileList"
          >
            <ImgCrop
              showGrid
              rotationSlider
              aspectSlider
              showReset
              aspect={0.6999}
            >
              <Upload
                {...uploadProps}
                loading={uploading}
              >
                {fileList.length >= 1 ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </ImgCrop>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label={null}>
            {previewImage && (
              <Image
                wrapperStyle={{ display: "none" }}
                preview={{
                  visible: previewOpen,
                  onVisibleChange: (visible) => setPreviewOpen(visible),
                  afterOpenChange: (visible) => !visible && setPreviewOpen(false),
                }}
                src={previewImage}
              />
            )}
          </Form.Item>
        </Col>

        <Col span={4}>
          <Form.Item
            name="status"
            label="Trạng thái hoạt động"
            valuePropName="checked"
            getValueFromEvent={(checked) => (checked ? "active" : "inactive")}
            getValueProps={(value) => ({ checked: value === "active" })}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            name="isTrending"
            label="Phim xu hướng"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Trending"
              unCheckedChildren="Normal"
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item label={null}>
            <Button className="mr-10" type="primary" htmlType="submit" loading={uploading}>
              {submitButtonText}
            </Button>
            {onCancel && (
              <Button className="ml-10" onClick={onCancel}>
                Hủy
              </Button>
            )}
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}

export default FilmForm;