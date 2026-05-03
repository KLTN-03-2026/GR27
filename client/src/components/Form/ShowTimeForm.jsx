import {
  Button,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Switch,
  DatePicker,
  TreeSelect,
  Alert,
  Space,
  Tag,
  Modal,
  Tooltip,
} from "antd";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  InfoCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { getAllFilms } from "../../services/filmServices";
import { getAllCity } from "../../services/cityServices";
import { getAllCinema } from "../../services/cinemaServices";
import { getAllRooms } from "../../services/roomServices";
import { createBulkShowTime } from "../../services/showTimeServices";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

// ─── Helper: Quy đổi phút → "Xh YY'" ──────────────────────────────────────
const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}'`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}'`;
};

// ─── Helper: Làm tròn phút lên tới bội số 5 gần nhất ─────────────────────
const roundUpToNearest5 = (minutes) => {
  if (minutes % 5 === 0) return minutes;
  return minutes + (5 - (minutes % 5));
};

// ─── Helper: Tính endTime tự động từ startTime + thời lượng phim ──────────
const calcEndTime = (startTime, durationMinutes) => {
  if (!startTime || !durationMinutes) return null;
  const rounded = roundUpToNearest5(durationMinutes);
  return startTime.add(rounded, "minute");
};

function ShowTimeForm({
  onFinish,
  onCancel,
  initialValues,
  submitButtonText = "Cập nhật",
  isEditMode = false,
}) {
  const [form] = Form.useForm();
  const [films, setFilms] = useState([]);
  const [cities, setCities] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [filteredCinemas, setFilteredCinemas] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedCinemaId, setSelectedCinemaId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [supportedFormats, setSupportedFormats] = useState([]);
  const initialValuesSetRef = useRef(false);

  // Lưu filmId đang chọn để lấy duration
  const [selectedFilmId, setSelectedFilmId] = useState(null);

  // State cho kiểm tra ghế đã đặt
  const [isEditable, setIsEditable] = useState(true);
  const [editWarning, setEditWarning] = useState(null);

  // ── State tạo hàng loạt ──────────────────────────────────────────────────
  const [bulkMode, setBulkMode] = useState(false); // Đang trong chế độ hàng loạt
  const [bulkRange, setBulkRange] = useState(null); // [fromDate, toDate]
  const [bulkTimeStr, setBulkTimeStr] = useState(""); // "HH:mm" giờ chiếu
  const [showBulkPicker, setShowBulkPicker] = useState(false); // Hiển thị picker
  const [bulkConfirmModal, setBulkConfirmModal] = useState(false); // Modal xác nhận
  const [bulkProgress, setBulkProgress] = useState(null); // { done, total, errors }
  const [bulkLoading, setBulkLoading] = useState(false);

  // Fetch data khi component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filmResult, cityResult, cinemaResult, roomResult] =
          await Promise.all([
            getAllFilms(),
            getAllCity(),
            getAllCinema(),
            getAllRooms(),
          ]);
        setFilms(filmResult.data || []);
        setCities(cityResult || []);
        setCinemas(cinemaResult || []);
        setRooms(roomResult.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const checkEditability = useCallback(() => {
    if (!initialValues) return;
    const seats = initialValues.seats || [];
    const blockedSeats = seats.filter(
      (seat) => seat.status === "blocked" || seat.status === "booked",
    );
    const blockedCount = blockedSeats.length;
    const endTime = dayjs(initialValues.endTime);
    const now = dayjs();
    const isPastShowtime = now.isAfter(endTime);

    if (blockedCount > 0 && !isPastShowtime) {
      setIsEditable(false);
      setEditWarning({
        type: "error",
        message: "Không thể chỉnh sửa suất chiếu này",
        description: `Đã có ${blockedCount} ghế được đặt. Bạn không thể chỉnh sửa suất chiếu khi đã có khách hàng đặt vé.`,
      });
    } else if (isPastShowtime) {
      setIsEditable(true);
      setEditWarning({
        type: "warning",
        message: "Cảnh báo",
        description:
          "Suất chiếu này đã kết thúc. Việc chỉnh sửa chỉ nên dùng để sửa lỗi dữ liệu.",
      });
    } else if (blockedCount > 0 && isPastShowtime) {
      setIsEditable(true);
      setEditWarning({
        type: "info",
        message: "Thông tin",
        description: `Suất chiếu đã kết thúc và có ${blockedCount} ghế đã được đặt. Chỉnh sửa cẩn thận.`,
      });
    } else {
      setIsEditable(true);
      setEditWarning(null);
    }
  }, [initialValues]);

  useEffect(() => {
    if (isEditMode && initialValues) {
      checkEditability();
    }
  }, [isEditMode, initialValues, checkEditability]);

  // Build cinema tree structure
  const buildCinemaTree = (cinemasList) => {
    const parentCinemas = cinemasList.filter((cinema) => !cinema.parentId);
    const childCinemas = cinemasList.filter((cinema) => cinema.parentId);
    return parentCinemas.map((parent) => ({
      title: parent.name,
      value: parent._id,
      key: parent._id,
      children: childCinemas
        .filter((child) => {
          const parentIdValue =
            typeof child.parentId === "object"
              ? child.parentId._id
              : child.parentId;
          return parentIdValue === parent._id;
        })
        .map((child) => ({
          title: `└─ ${child.name}`,
          value: child._id,
          key: child._id,
        })),
    }));
  };

  // Filter cinemas by selected city
  useEffect(() => {
    if (!selectedCityId) {
      setFilteredCinemas([]);
      return;
    }
    const filtered = cinemas.filter(
      (cinema) =>
        cinema.cityIds &&
        cinema.cityIds.some((cityId) => {
          const cityIdValue = typeof cityId === "object" ? cityId._id : cityId;
          return cityIdValue === selectedCityId;
        }),
    );
    setFilteredCinemas(buildCinemaTree(filtered));
  }, [selectedCityId, cinemas]);

  // Filter rooms by selected cinema
  useEffect(() => {
    if (!selectedCinemaId) {
      setFilteredRooms([]);
      setSupportedFormats([]);
      return;
    }
    const filtered = rooms.filter((room) => {
      const roomCinemaId =
        typeof room.cinemaId === "object" ? room.cinemaId._id : room.cinemaId;
      return roomCinemaId === selectedCinemaId;
    });
    setFilteredRooms(filtered);
  }, [selectedCinemaId, rooms]);

  // Update supported formats when room is selected
  useEffect(() => {
    if (!selectedRoomId) {
      setSupportedFormats([]);
      return;
    }
    const selectedRoom = rooms.find((room) => room._id === selectedRoomId);
    if (selectedRoom && selectedRoom.supportedFormats) {
      setSupportedFormats(selectedRoom.supportedFormats);
      const currentFormat = form.getFieldValue("format");
      if (
        currentFormat &&
        !selectedRoom.supportedFormats.includes(currentFormat)
      ) {
        form.setFieldValue("format", undefined);
      }
    }
  }, [selectedRoomId, rooms, form]);

  // Handle city change
  const handleCityChange = (value) => {
    setSelectedCityId(value);
    form.setFieldValue("cinemaId", undefined);
    form.setFieldValue("roomId", undefined);
    form.setFieldValue("format", undefined);
    setSelectedCinemaId(null);
    setSelectedRoomId(null);
  };

  // Handle cinema change
  const handleCinemaChange = (value) => {
    setSelectedCinemaId(value);
    form.setFieldValue("roomId", undefined);
    form.setFieldValue("format", undefined);
    setSelectedRoomId(null);
  };

  // Handle room change
  const handleRoomChange = (value) => {
    setSelectedRoomId(value);
    form.setFieldValue("format", undefined);
  };

  // ── [VẤN ĐỀ 1] Handle film change → cập nhật selectedFilmId ──────────────
  const handleFilmChange = (value) => {
    setSelectedFilmId(value);
    // Reset endTime nếu có startTime (sẽ tự tính lại)
    const currentTimeRange = form.getFieldValue("timeRange");
    if (currentTimeRange && currentTimeRange[0]) {
      const film = films.find((f) => f._id === value);
      if (film && film.duration) {
        const newEnd = calcEndTime(currentTimeRange[0], film.duration);
        form.setFieldValue("timeRange", [currentTimeRange[0], newEnd]);
      }
    }
  };

  // Set initial values
  useEffect(() => {
    if (initialValues && !initialValuesSetRef.current) {
      const processedCinemaId =
        typeof initialValues.cinemaId === "object"
          ? initialValues.cinemaId._id
          : initialValues.cinemaId;
      const processedRoomId =
        typeof initialValues.roomId === "object"
          ? initialValues.roomId._id
          : initialValues.roomId;
      const processedFilmId =
        typeof initialValues.filmId === "object"
          ? initialValues.filmId._id
          : initialValues.filmId;

      if (processedCinemaId) {
        const cinema = cinemas.find((c) => c._id === processedCinemaId);
        if (cinema && cinema.cityIds && cinema.cityIds.length > 0) {
          const firstCityId =
            typeof cinema.cityIds[0] === "object"
              ? cinema.cityIds[0]._id
              : cinema.cityIds[0];
          setSelectedCityId(firstCityId);
        }
        setSelectedCinemaId(processedCinemaId);
      }
      if (processedRoomId) setSelectedRoomId(processedRoomId);
      if (processedFilmId) setSelectedFilmId(processedFilmId);

      let basePriceValue = initialValues.basePrice || 0;
      let vipExtraFee = 0;
      let coupleExtraFee = 0;

      if (initialValues.seatTypes && Array.isArray(initialValues.seatTypes)) {
        const vipSeat = initialValues.seatTypes.find((st) => st.type === "vip");
        const coupleSeat = initialValues.seatTypes.find(
          (st) => st.type === "couple",
        );
        if (vipSeat) vipExtraFee = vipSeat.extraFee || 0;
        if (coupleSeat) coupleExtraFee = coupleSeat.extraFee || 0;
      }

      form.setFieldsValue({
        filmId: processedFilmId,
        cinemaId: processedCinemaId,
        roomId: processedRoomId,
        format: initialValues.format,
        basePrice: basePriceValue,
        vipPrice: basePriceValue + vipExtraFee,
        couplePrice: basePriceValue + coupleExtraFee,
        timeRange:
          initialValues.startTime && initialValues.endTime
            ? [dayjs(initialValues.startTime), dayjs(initialValues.endTime)]
            : null,
        status: initialValues.status,
      });

      initialValuesSetRef.current = true;
    }
  }, [initialValues, form, cinemas]);

  useEffect(() => {
    initialValuesSetRef.current = false;
  }, [initialValues]);

  // ── [VẤN ĐỀ 3] Khi startTime thay đổi → tự động tính endTime ─────────────
  const handleStartTimeChange = (dates) => {
    if (!dates || !dates[0]) return;
    const startTime = dates[0];
    const filmId = form.getFieldValue("filmId") || selectedFilmId;
    const film = films.find((f) => f._id === filmId);
    if (film && film.duration) {
      const autoEnd = calcEndTime(startTime, film.duration);
      form.setFieldValue("timeRange", [startTime, autoEnd]);
    }
  };

  const handleFinish = async (values) => {
    console.log("Form values before processing:", values);
    try {
      const [startTime, endTime] = values.timeRange || [];
      const basePrice = values.basePrice || 0;
      const vipPrice = values.vipPrice || basePrice;
      const couplePrice = values.couplePrice || basePrice;

      const seatTypes = [
        { type: "standard", extraFee: 0 },
        { type: "vip", extraFee: Math.max(0, vipPrice - basePrice) },
        { type: "couple", extraFee: Math.max(0, couplePrice - basePrice) },
      ];

      const finalData = {
        filmId: values.filmId,
        cinemaId: values.cinemaId,
        roomId: values.roomId,
        startTime: startTime ? startTime.toISOString() : null,
        endTime: endTime ? endTime.toISOString() : null,
        format: values.format,
        basePrice: basePrice,
        seatTypes: seatTypes,
        status:
          typeof values.status === "boolean"
            ? values.status
              ? "active"
              : "inactive"
            : values.status,
      };

      const result = await onFinish(finalData);
      if (result === true && !isEditMode) {
        initialValuesSetRef.current = false;
      }
      return result;
    } catch (error) {
      console.error("Form submission error:", error);
      return false;
    }
  };

  const getInitialFormValues = () => {
    const defaultValues = {
      status: "inactive",
      basePrice: 50000,
      vipPrice: 80000,
      couplePrice: 120000,
    };
    return initialValues
      ? { ...defaultValues, ...initialValues }
      : defaultValues;
  };

  // ── [VẤN ĐỀ 1] Tạo options phim với thời lượng ────────────────────────────
  const filmOptions = films
    .filter((film) => film.status === "active")
    .map((film) => ({
      label: film.duration
        ? `${film.title} - ${formatDuration(film.duration)}`
        : film.title,
      value: film._id,
    }));

  // ── [VẤN ĐỀ 4] Xử lý tạo hàng loạt ─────────────────────────────────────
  const handleBulkClick = () => {
    setShowBulkPicker(true);
  };

  const handleBulkPickerConfirm = () => {
    if (!bulkRange || !bulkRange[0] || !bulkRange[1]) return;
    if (!bulkTimeStr) return;
    setShowBulkPicker(false);
    setBulkMode(true);
  };

  const handleBulkPickerCancel = () => {
    setShowBulkPicker(false);
    setBulkRange(null);
    setBulkTimeStr("");
  };

  const handleCancelBulkMode = () => {
    setBulkMode(false);
    setBulkRange(null);
    setBulkTimeStr("");
  };

  // Khi bấm submit form trong bulk mode → hiện modal xác nhận
  const handleFormSubmitBulk = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }
    setBulkConfirmModal(true);
  };

  // Thực hiện tạo hàng loạt sau khi xác nhận
  const handleConfirmBulkCreate = async () => {
    setBulkConfirmModal(false);
    setBulkLoading(true);

    const values = form.getFieldsValue();
    const filmId = values.filmId || selectedFilmId;
    const film = films.find((f) => f._id === filmId);
    if (!film) return;

    const basePrice = values.basePrice || 0;
    const vipPrice = values.vipPrice || basePrice;
    const couplePrice = values.couplePrice || basePrice;

    const seatTypes = [
      { type: "standard", extraFee: 0 },
      { type: "vip", extraFee: Math.max(0, vipPrice - basePrice) },
      { type: "couple", extraFee: Math.max(0, couplePrice - basePrice) },
    ];

    // Tạo danh sách ngày từ bulkRange
    const [fromDate, toDate] = bulkRange;
    const [hStr, mStr] = bulkTimeStr.split(":");
    const startHour = parseInt(hStr, 10);
    const startMin = parseInt(mStr, 10);

    const dates = [];
    let cur = fromDate.clone().startOf("day");
    const end = toDate.clone().startOf("day");
    while (cur.isSame(end) || cur.isBefore(end)) {
      dates.push(cur.clone());
      cur = cur.add(1, "day");
    }

    const showtimes = dates.map((d) => {
      const start = d.hour(startHour).minute(startMin).second(0).millisecond(0);
      const endT = calcEndTime(start, film.duration);
      return {
        filmId: values.filmId,
        cinemaId: values.cinemaId,
        roomId: values.roomId,
        startTime: start.toISOString(),
        endTime: endT ? endT.toISOString() : null,
        format: values.format,
        basePrice,
        seatTypes,
        status:
          typeof values.status === "boolean"
            ? values.status
              ? "active"
              : "inactive"
            : values.status || "inactive",
      };
    });

    // Gọi bulk API
    try {
      const result = await createBulkShowTime({ showtimes });
      const created = result?.data?.created || 0;
      const skipped = result?.data?.skipped || 0;
      const errors = result?.data?.errors || [];
      setBulkProgress({ created, skipped, errors, total: showtimes.length });
    } catch (err) {
      const errMsg =
        err?.response?.data?.message || "Lỗi khi tạo suất chiếu hàng loạt";
      setBulkProgress({
        created: 0,
        skipped: 0,
        errors: [errMsg],
        total: showtimes.length,
      });
    } finally {
      setBulkLoading(false);
      setBulkMode(false);
      setBulkRange(null);
      setBulkTimeStr("");
    }
  };

  // ── Bulk time picker modal ─────────────────────────────────────────────────
  const bulkTimeOptions = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      bulkTimeOptions.push({ label, value: label });
    }
  }

  return (
    <>
      {/* Warning Alert nếu có */}
      {editWarning && (
        <Alert
          message={editWarning.message}
          description={editWarning.description}
          type={editWarning.type}
          showIcon
          icon={
            editWarning.type === "error" ? (
              <WarningOutlined />
            ) : (
              <InfoCircleOutlined />
            )
          }
          style={{ marginBottom: 24 }}
          banner
        />
      )}

      {/* Tag trạng thái bulk mode */}
      {bulkMode && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <Space>
              <ThunderboltOutlined />
              <span>
                Đang thực hiện tạo suất chiếu hàng loạt từ{" "}
                <strong>{bulkRange[0].format("DD/MM/YYYY")}</strong> đến{" "}
                <strong>{bulkRange[1].format("DD/MM/YYYY")}</strong>, khung giờ{" "}
                <strong>{bulkTimeStr}</strong>
              </span>
              <Tag
                color="red"
                icon={<CloseCircleOutlined />}
                style={{ cursor: "pointer" }}
                onClick={handleCancelBulkMode}
              >
                Hủy hàng loạt
              </Tag>
            </Space>
          }
        />
      )}

      {/* Kết quả bulk nếu có */}
      {bulkProgress && (
        <Alert
          type={bulkProgress.errors.length > 0 ? "warning" : "success"}
          showIcon
          closable
          onClose={() => setBulkProgress(null)}
          style={{ marginBottom: 16 }}
          message={`Tạo hàng loạt hoàn tất: ${bulkProgress.created} thành công, ${bulkProgress.skipped} bỏ qua (trùng/vi phạm giãn cách)`}
          description={
            bulkProgress.errors.length > 0 ? (
              <ul style={{ marginBottom: 0, paddingLeft: 16 }}>
                {bulkProgress.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            ) : null
          }
        />
      )}

      <Form
        form={form}
        onFinish={handleFinish}
        initialValues={getInitialFormValues()}
        layout="vertical"
        disabled={!isEditable}
      >
        <Row gutter={[20, 5]}>
          {/* ── [VẤN ĐỀ 1] Phim chiếu với thời lượng ─────────────────────── */}
          <Col span={12}>
            <Form.Item
              name="filmId"
              label="Phim chiếu"
              rules={[{ required: true, message: "Vui lòng chọn phim" }]}
            >
              <Select
                showSearch
                placeholder="Chọn phim"
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={filmOptions}
                onChange={handleFilmChange}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Thành phố (để lọc rạp)"
              tooltip="Chọn thành phố để lọc danh sách rạp chiếu"
            >
              <Select
                allowClear
                placeholder="Chọn thành phố"
                showSearch
                optionFilterProp="label"
                onChange={handleCityChange}
                value={selectedCityId}
                options={cities.map((city) => ({
                  label: city.name,
                  value: city._id,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="cinemaId"
              label="Rạp chiếu"
              rules={[{ required: true, message: "Vui lòng chọn rạp chiếu" }]}
            >
              <TreeSelect
                showSearch
                style={{ width: "100%" }}
                dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                placeholder="Chọn rạp chiếu"
                allowClear
                treeDefaultExpandAll
                treeData={filteredCinemas}
                disabled={!selectedCityId}
                onChange={handleCinemaChange}
                treeNodeFilterProp="title"
                filterTreeNode={(input, treeNode) =>
                  (treeNode?.title ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                notFoundContent={
                  !selectedCityId
                    ? "Vui lòng chọn thành phố trước"
                    : "Không có rạp nào trong thành phố này"
                }
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="roomId"
              label="Phòng chiếu"
              rules={[{ required: true, message: "Vui lòng chọn phòng chiếu" }]}
            >
              <Select
                showSearch
                placeholder="Chọn phòng chiếu"
                optionFilterProp="children"
                disabled={!selectedCinemaId}
                onChange={handleRoomChange}
                notFoundContent={
                  !selectedCinemaId
                    ? "Vui lòng chọn rạp chiếu trước"
                    : "Không có phòng chiếu nào"
                }
                options={filteredRooms
                  .filter((room) => room.status === "active")
                  .map((room) => ({
                    label: `${room.name} (${room.seatLayout?.length || 0} ghế)`,
                    value: room._id,
                  }))}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="format"
              label="Hình thức chiếu"
              rules={[
                { required: true, message: "Vui lòng chọn hình thức chiếu" },
              ]}
            >
              <Select
                placeholder="Chọn hình thức chiếu"
                disabled={!selectedRoomId || supportedFormats.length === 0}
                notFoundContent={
                  !selectedRoomId
                    ? "Vui lòng chọn phòng chiếu trước"
                    : "Phòng này không hỗ trợ định dạng nào"
                }
                options={supportedFormats.map((format) => ({
                  label: format,
                  value: format,
                }))}
              />
            </Form.Item>
          </Col>

          {/* ── [VẤN ĐỀ 2 + 3 + 4] Thời gian chiếu ─────────────────────────── */}
          <Col span={12}>
            <Form.Item
              name="timeRange"
              label={
                <Space>
                  <span>Thời gian chiếu</span>
                  {/* Nút Tạo hàng loạt */}
                  {!isEditMode && (
                    <Tooltip title="Tạo suất chiếu cho nhiều ngày liên tiếp">
                      <Button
                        size="small"
                        type="dashed"
                        icon={<ThunderboltOutlined />}
                        onClick={(e) => {
                          e.preventDefault();
                          handleBulkClick();
                        }}
                        disabled={!isEditable}
                      >
                        Tạo hàng loạt
                      </Button>
                    </Tooltip>
                  )}
                </Space>
              }
              rules={[
                {
                  validator: (_, value) => {
                    if (bulkMode) return Promise.resolve();
                    if (!value || !value[0])
                      return Promise.reject("Vui lòng chọn thời gian chiếu");
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <RangePicker
                showTime={{ format: "HH:mm" }}
                format="DD/MM/YYYY HH:mm"
                placeholder={["Giờ bắt đầu", "Giờ kết thúc (tự động)"]}
                style={{ width: "100%" }}
                // LƯU Ý CHỖ NÀY
                disabledDate={(current) => {
    const film = films.find((f) => f._id === selectedFilmId);
    if (film?.releaseDate) {
      return current && current.isBefore(dayjs(film.releaseDate), "day");
    }
    return false;
  }}
                // [VẤN ĐỀ 3] Chỉ cho phép chọn startTime, endTime được lock
                onCalendarChange={(dates) => {
                  if (dates && dates[0]) {
                    handleStartTimeChange(dates);
                  }
                }}
                // Disable endTime panel — người dùng chỉ chọn start, end tự tính
                disabledTime={() => ({})}
              />
            </Form.Item>
            {/* Ghi chú thời lượng */}
            {selectedFilmId &&
              (() => {
                const film = films.find((f) => f._id === selectedFilmId);
                if (!film || !film.duration) return null;
                return (
                  <div
                    style={{
                      marginTop: -16,
                      marginBottom: 8,
                      color: "#888",
                      fontSize: 12,
                    }}
                  >
                    <InfoCircleOutlined /> Thời lượng phim:{" "}
                    {formatDuration(film.duration)} → endTime tự động tính (làm
                    tròn lên bội số 5 phút)
                  </div>
                );
              })()}
          </Col>

          <Col span={8}>
            <Form.Item
              name="basePrice"
              label="Giá ghế cơ bản (Standard)"
              rules={[
                { required: true, message: "Vui lòng nhập giá ghế cơ bản" },
                { type: "number", min: 0, message: "Giá phải lớn hơn 0" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                placeholder="50000"
                addonAfter="VNĐ"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="vipPrice"
              label="Giá ghế VIP"
              rules={[
                { required: true, message: "Vui lòng nhập giá ghế VIP" },
                { type: "number", min: 0, message: "Giá phải lớn hơn 0" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                placeholder="80000"
                addonAfter="VNĐ"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="couplePrice"
              label="Giá ghế đôi (Couple)"
              rules={[
                { required: true, message: "Vui lòng nhập giá ghế đôi" },
                { type: "number", min: 0, message: "Giá phải lớn hơn 0" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                placeholder="120000"
                addonAfter="VNĐ"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="status"
              label="Trạng thái"
              valuePropName="checked"
              getValueFromEvent={(checked) => (checked ? "active" : "inactive")}
              getValueProps={(value) => ({ checked: value === "active" })}
            >
              <Switch
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item>
              <Space>
                {bulkMode ? (
                  <Button
                    type="primary"
                    loading={bulkLoading}
                    icon={<ThunderboltOutlined />}
                    onClick={handleFormSubmitBulk}
                  >
                    Tạo suất chiếu hàng loạt
                  </Button>
                ) : (
                  <Button type="primary" htmlType="submit">
                    {submitButtonText}
                  </Button>
                )}
                <Button onClick={onCancel}>Hủy</Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {/* ── Modal chọn khoảng ngày & giờ cho bulk ─────────────────────────── */}
      <Modal
        title={
          <Space>
            <ThunderboltOutlined style={{ color: "#1890ff" }} />
            Tạo suất chiếu hàng loạt
          </Space>
        }
        open={showBulkPicker}
        onOk={handleBulkPickerConfirm}
        onCancel={handleBulkPickerCancel}
        okText="Xác nhận"
        cancelText="Hủy"
        okButtonProps={{
          disabled: !bulkRange || !bulkTimeStr,
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>
              Từ ngày — Đến ngày:
            </div>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              
              format="DD/MM/YYYY"
              disabledDate={(d) => d && d.isBefore(dayjs().startOf("day"))}
              onChange={(dates) => setBulkRange(dates)}
              value={bulkRange}
            />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>
              Khung giờ chiếu:
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="Chọn giờ bắt đầu"
              options={bulkTimeOptions}
              value={bulkTimeStr || undefined}
              onChange={(v) => setBulkTimeStr(v)}
              showSearch
            />
          </div>
          {bulkRange &&
            bulkTimeStr &&
            (() => {
              const film = films.find(
                (f) =>
                  f._id === (form.getFieldValue("filmId") || selectedFilmId),
              );
              return (
                <Alert
                  type="info"
                  showIcon
                  message={`Sẽ tạo ${
                    bulkRange[1].diff(bulkRange[0], "day") + 1
                  } suất chiếu. ${
                    film
                      ? `Giờ kết thúc tự động: ${bulkTimeStr} + ${formatDuration(roundUpToNearest5(film.duration || 0))}`
                      : "Vui lòng chọn phim trước để tính giờ kết thúc."
                  }`}
                />
              );
            })()}
        </Space>
      </Modal>

      {/* ── Modal xác nhận tạo hàng loạt ─────────────────────────────────── */}
      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: "#faad14" }} />
            Xác nhận tạo suất chiếu hàng loạt
          </Space>
        }
        open={bulkConfirmModal}
        onOk={handleConfirmBulkCreate}
        onCancel={() => setBulkConfirmModal(false)}
        okText="Xác nhận tạo"
        cancelText="Hủy"
        okButtonProps={{ danger: false, type: "primary" }}
      >
        {bulkRange && bulkTimeStr && (
          <Space direction="vertical">
            <p>
              Bạn đang tiến hành <strong>tạo suất chiếu hàng loạt</strong>:
            </p>
            <ul>
              <li>
                Từ <strong>{bulkRange[0].format("DD/MM/YYYY")}</strong> đến{" "}
                <strong>{bulkRange[1].format("DD/MM/YYYY")}</strong>
              </li>
              <li>
                Khung giờ: <strong>{bulkTimeStr}</strong>
              </li>
              <li>
                Tổng số ngày:{" "}
                <strong>{bulkRange[1].diff(bulkRange[0], "day") + 1}</strong>
              </li>
            </ul>
            <p style={{ color: "#888" }}>
              Hệ thống sẽ tự động bỏ qua các ngày bị trùng suất chiếu hoặc vi
              phạm giãn cách 30 phút. Sau khi xác nhận, tiến trình sẽ bắt đầu
              ngay.
            </p>
          </Space>
        )}
      </Modal>
    </>
  );
}

export default ShowTimeForm;
