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
  AutoComplete,
  Spin as SpinInline,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import { useEffect, useState, useRef, useCallback } from "react";
import { getCategories } from "../../services/categoryServices";
import {
  searchTmdbFilms,
  getTmdbFilmDetail,
} from "../../services/tmdbServices";
import useImageUpload from "../../hooks/useImageUpload";
import dayjs from "dayjs";
import { DEFAULT_IMAGES } from "../../constants";

const { TextArea } = Input;

// Bảng map tên TMDb genre → tên category trong DB của bạn
// (chỉ cần khai báo những cái BỊ LỆCH tên, còn lại match 1-1)
const TMDB_GENRE_MAP = {
  Music: "Musical",
  History: "Historical",
};

function FilmForm({
  onFinish,
  onCancel,
  initialValues,
  submitButtonText = "Cập nhật",
}) {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const initialValuesSetRef = useRef(false);

  // TMDb states
  const [tmdbOptions, setTmdbOptions] = useState([]);
  const [tmdbSearching, setTmdbSearching] = useState(false);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const debounceRef = useRef(null);

  const {
    fileList,
    previewOpen,
    previewImage,
    uploading,
    setPreviewOpen,
    setInitialImage,
    forceSetImage,
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
      const formattedValues = { ...initialValues };

      if (Array.isArray(initialValues.otherTitles)) {
        formattedValues.otherTitles = initialValues.otherTitles.join(", ");
      }
      if (Array.isArray(initialValues.actors)) {
        formattedValues.actors = initialValues.actors.join(", ");
      }
      if (Array.isArray(initialValues.directors)) {
        formattedValues.directors = initialValues.directors.join(", ");
      }
      if (Array.isArray(initialValues.categoryIds)) {
        formattedValues.categoryIds = initialValues.categoryIds.map(
          (c) => c._id,
        );
      }
      if (initialValues.thumbnail) {
        setInitialImage(initialValues.thumbnail);
      }

      form.setFieldsValue({
        ...formattedValues,
        releaseDate: initialValues.releaseDate
          ? dayjs(initialValues.releaseDate)
          : null,
      });

      initialValuesSetRef.current = true;
    }
  }, [initialValues, form, setInitialImage]);

  useEffect(() => {
    initialValuesSetRef.current = false;
  }, [initialValues]);

  // ── TMDb: Xử lý gõ vào field title ────────────────────────────────────────
  const handleTitleSearch = useCallback(
    (value) => {
      form.setFieldValue("title", value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value || value.trim().length < 2) {
        setTmdbOptions([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setTmdbSearching(true);
        try {
          const result = await searchTmdbFilms(value.trim());
          const films = result?.data || [];

          if (films.length === 0) {
            setTmdbOptions([
              {
                value: value,
                label: (
                  <span style={{ color: "#999", fontStyle: "italic" }}>
                    🎬 TMDb không tìm thấy phim phù hợp
                  </span>
                ),
                disabled: true,
              },
            ]);
          } else {
            setTmdbOptions(
              films.map((film) => ({
                value: film.title,
                tmdbId: film.tmdbId,
                label: (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    {film.thumbnail ? (
                      <img
                        src={film.thumbnail}
                        alt=""
                        style={{
                          width: 32,
                          height: 48,
                          objectFit: "cover",
                          borderRadius: 3,
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 48,
                          background: "#f0f0f0",
                          borderRadius: 3,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {film.title}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#999", marginTop: 2 }}
                      >
                        {film.originalTitle !== film.title
                          ? film.originalTitle
                          : ""}
                        {film.originalTitle !== film.title && film.releaseDate
                          ? " • "
                          : ""}
                        {film.releaseDate?.slice(0, 4) || ""}
                      </div>
                    </div>
                  </div>
                ),
              })),
            );
          }
        } catch {
          setTmdbOptions([]);
        } finally {
          setTmdbSearching(false);
        }
      }, 500);
    },
    [form],
  );

  // ── TMDb: Khi admin chọn phim từ dropdown ──────────────────────────────────
  const handleTmdbSelect = useCallback(
    async (value, option) => {
      if (!option?.tmdbId || option.disabled) return;

      setTmdbLoading(true);
      try {
        const result = await getTmdbFilmDetail(option.tmdbId);
        const data = result?.data;
        if (!data) return;

        // Auto-map TMDb genres → categoryIds trong DB
        const matchedCategoryIds = [];
        const matchedGenreNames = [];

        if (data.tmdbGenres && categories.length > 0) {
          data.tmdbGenres.forEach((genreName) => {
            // Áp dụng bảng map trước (với genre bị lệch tên)
            const normalizedName = TMDB_GENRE_MAP[genreName] || genreName;

            const matched = categories.find(
              (cat) => cat.label.toLowerCase() === normalizedName.toLowerCase(),
            );
            if (matched) {
              matchedCategoryIds.push(matched.value);
              matchedGenreNames.push(matched.label);
            }
          });
        }

        // Auto-fill toàn bộ form
        form.setFieldsValue({
          title: data.title,
          otherTitles: data.otherTitles || "",
          description: data.description,
          duration: data.duration || undefined,
          releaseDate: data.releaseDate ? dayjs(data.releaseDate) : null,
          actors: data.actors,
          directors: data.directors,
          filmLanguage: data.filmLanguage,
          subtitles: data.subtitles,
          ageRating: data.ageRating || undefined,
          isTrending: data.isTrending,
          trailer: data.trailer || "",
          categoryIds: matchedCategoryIds,
          availableFormats: ["2D"],         
        });

        // Set poster dùng forceSetImage (sẽ dùng externalImageUrl, không upload lại)
        if (data.thumbnail) {
          forceSetImage(data.thumbnail);
        }

        setTmdbOptions([]);
      } catch (err) {
        console.error("Lỗi load TMDb detail:", err);
      } finally {
        setTmdbLoading(false);
      }
    },
    [form, categories, forceSetImage],
  );

  // ── Submit form ────────────────────────────────────────────────────────────
  const handleFinish = async (values) => {
    try {
      const thumbnailUrl = await getFinalImageUrl(initialValues?.thumbnail);
      values.thumbnail = thumbnailUrl;

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

      if (typeof values.status === "boolean") {
        values.status = values.status ? "active" : "inactive";
      }

      if (values.releaseDate) {
        values.releaseDate = values.releaseDate.toDate();
      }

      const result = await onFinish(values);

      if (result === true) {
        form.resetFields();
        resetAll();

        initialValuesSetRef.current = false;
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const getInitialFormValues = () => {
    const defaultValues = {
      status: "inactive",
      isTrending: false,
      availableFormats: [],
    };
    if (initialValues) {
      return {
        ...defaultValues,
        ...initialValues,
        releaseDate: initialValues.releaseDate
          ? dayjs(initialValues.releaseDate)
          : null,
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
        {/* ── Title + TMDb AutoComplete ── */}
        <Col span={24}>
          <Form.Item
            name="title"
            label={
              <span>
                Tên phim&nbsp;
                <span
                  style={{ fontWeight: 400, color: "#1677ff", fontSize: 12 }}
                >
                  — Gõ để tìm tự động từ TMDb
                </span>
              </span>
            }
            rules={[{ required: true, message: "Vui lòng nhập tên phim" }]}
          >
            <AutoComplete
              options={tmdbOptions}
              onSearch={handleTitleSearch}
              onSelect={handleTmdbSelect}
              notFoundContent={null}
              popupMatchSelectWidth={480}
            >
              <Input
                placeholder="Nhập tên phim để tìm kiếm từ TMDb..."
                suffix={
                  tmdbSearching ? (
                    <SpinInline size="small" />
                  ) : (
                    <span style={{ fontSize: 11, color: "#bbb" }}>TMDb</span>
                  )
                }
              />
            </AutoComplete>
          </Form.Item>

          {/* Loading indicator khi đang fetch detail */}
          {tmdbLoading && (
            <div
              style={{
                marginTop: -12,
                marginBottom: 8,
                color: "#1677ff",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <SpinInline size="small" />
              Đang tải thông tin phim từ TMDb...
            </div>
          )}
        </Col>

        {/* ── Other Titles ── */}
        <Col span={24}>
          <Form.Item
            name="otherTitles"
            label="Tên khác"
            tooltip="Nhập các tên khác, cách nhau bằng dấu phẩy"
          >
            <Input placeholder="Ví dụ: Tên tiếng Anh, Tên tiếng Hàn, Tên khác..." />
          </Form.Item>
        </Col>

        {/* ── Category + Available Formats ── */}
        <Col span={12}>
          <Form.Item
            name="categoryIds"
            label="Thể loại"
            rules={[{ required: true, message: "Vui lòng chọn thể loại" }]}
          >
            <Select
              mode="multiple"
              allowClear
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

        {/* ── Actors ── */}
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

        {/* ── Directors ── */}
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

        {/* ── Release Date + Duration ── */}
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

        {/* ── Age Rating + Language ── */}
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

        {/* ── Subtitles ── */}
        <Col span={24}>
          <Form.Item name="subtitles" label="Phụ đề">
            <Input placeholder="Ví dụ: Tiếng Việt, English" />
          </Form.Item>
        </Col>

        {/* ── Trailer ── */}
        <Col span={24}>
          <Form.Item
            name="trailer"
            label="Link Trailer"
            rules={[{ type: "url", message: "Vui lòng nhập URL hợp lệ" }]}
          >
            <Input placeholder="https://www.youtube.com/watch?v=..." />
          </Form.Item>
        </Col>

        {/* ── Description ── */}
        <Col span={24}>
          <Form.Item
            name="description"
            label="Mô tả phim"
            rules={[{ required: true, message: "Vui lòng nhập mô tả phim" }]}
          >
            <TextArea rows={6} placeholder="Nhập mô tả chi tiết về phim" />
          </Form.Item>
        </Col>

        {/* ── Upload Poster ── */}
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
              <Upload {...uploadProps} loading={uploading}>
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
                  afterOpenChange: (visible) =>
                    !visible && setPreviewOpen(false),
                }}
                src={previewImage}
              />
            )}
          </Form.Item>
        </Col>

        {/* ── Status + Trending ── */}
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
            <Switch checkedChildren="Trending" unCheckedChildren="Normal" />
          </Form.Item>
        </Col>

        {/* ── Buttons ── */}
        <Col span={24}>
          <Form.Item label={null}>
            <Button
              className="mr-10"
              type="primary"
              htmlType="submit"
              loading={uploading || tmdbLoading}
            >
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
