import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  message,
  Tooltip,
  Typography,
  Card,
} from "antd";
import {
  UndoOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  getTrashShowTimes,
  restoreShowTimes,
  permanentDeleteShowTime,
} from "../../../services/showTimeServices";
import getColumnSearchProps from "../../../helpers/getColumnSearchProps";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";

const { Title } = Typography;

const ShowTimeTrashPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [showTimes, setShowTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Pagination state (FE tự xử lý, API trả về hết)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search states
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTrashShowTimes = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTrashShowTimes();
      setShowTimes(result.data || []);
    } catch (err) {
      console.error("Error fetching trash showtimes:", err);
      setError(
        err.response?.data?.message || "Không thể tải danh sách suất chiếu đã xóa"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashShowTimes();
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleRestore = async (showtimeId, label) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`restore_${showtimeId}`]: true }));
      await restoreShowTimes(showtimeId);
      setShowTimes((prev) => prev.filter((item) => item._id !== showtimeId));
      messageApi.success(`Đã khôi phục suất chiếu "${label}" thành công`);
    } catch (err) {
      console.error("Error restoring showtime:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể khôi phục suất chiếu"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`restore_${showtimeId}`]: false }));
    }
  };

  const handlePermanentDelete = async (showtimeId, label) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`delete_${showtimeId}`]: true }));
      await permanentDeleteShowTime(showtimeId);
      setShowTimes((prev) => prev.filter((item) => item._id !== showtimeId));
      messageApi.success(`Đã xóa vĩnh viễn suất chiếu "${label}"`);
    } catch (err) {
      console.error("Error permanently deleting showtime:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể xóa vĩnh viễn suất chiếu"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete_${showtimeId}`]: false }));
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getShowtimeLabel = (record) => {
    const film =
      record.filmId && typeof record.filmId === "object"
        ? record.filmId.title
        : record.filmId || "N/A";
    const date = record.startTime
      ? dayjs(record.startTime).format("DD/MM/YYYY HH:mm")
      : "N/A";
    return `${film} — ${date}`;
  };

  const renderFilmInfo = (filmId, record) => {
    const title = filmId && typeof filmId === "object" ? filmId.title : filmId || "N/A";
    return (
      <div>
        <div style={{ fontWeight: "bold", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#666" }}>
          ID: {record._id.slice(-8)}
        </div>
      </div>
    );
  };

  const renderStatusTag = (status) => {
    const config =
      status === "active"
        ? { color: "green", text: "Hoạt động", icon: <CheckCircleOutlined /> }
        : { color: "red", text: "Ngưng hoạt động", icon: <CloseCircleOutlined /> };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // ─── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Tên phim",
      dataIndex: "filmId",
      key: "filmId",
      width: 200,
      ...getColumnSearchProps(
        "filmId",
        searchText,
        setSearchText,
        searchedColumn,
        setSearchedColumn,
        searchInput
      ),
      render: renderFilmInfo,
    },
    {
      title: "Ngày giờ chiếu",
      key: "showTime",
      width: 160,
      align: "center",
      sorter: (a, b) => dayjs(a.startTime).unix() - dayjs(b.startTime).unix(),
      render: (_, record) => (
        <div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: 14,
              marginBottom: 4,
              color: "#1890ff",
            }}
          >
            <ClockCircleOutlined />{" "}
            {dayjs(record.startTime).format("HH:mm")} -{" "}
            {dayjs(record.endTime).format("HH:mm")}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>
            <CalendarOutlined /> {dayjs(record.startTime).format("DD/MM/YYYY")}
          </div>
        </div>
      ),
    },
    {
      title: "Phòng chiếu",
      dataIndex: "roomId",
      key: "roomId",
      width: 130,
      align: "center",
      render: (roomId) =>
        roomId && typeof roomId === "object" ? roomId.name : roomId || "N/A",
    },
    {
      title: "Rạp chiếu",
      dataIndex: "cinemaId",
      key: "cinemaId",
      width: 180,
      render: (cinemaId) =>
        cinemaId && typeof cinemaId === "object"
          ? cinemaId.name
          : cinemaId || "N/A",
    },
    {
      title: "Định dạng",
      dataIndex: "format",
      key: "format",
      width: 100,
      align: "center",
      render: (format) => (
        <Tag color="cyan" style={{ fontSize: 13 }}>
          {format}
        </Tag>
      ),
    },
    {
      title: "Tổng số ghế",
      key: "totalSeats",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Tag color="blue" style={{ fontSize: 14, fontWeight: "bold" }}>
          {record.seats?.length || 0}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center",
      render: renderStatusTag,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, record) => {
        const label = getShowtimeLabel(record);
        return (
          <Space size="small">
            <Tooltip title="Khôi phục">
              <Popconfirm
                title="Xác nhận khôi phục"
                description={`Khôi phục suất chiếu này?`}
                onConfirm={() => handleRestore(record._id, label)}
                okText="Khôi phục"
                cancelText="Hủy"
              >
                <Button
                  type="default"
                  icon={<UndoOutlined />}
                  size="small"
                  loading={actionLoading[`restore_${record._id}`]}
                  style={{ color: "#52c41a", borderColor: "#52c41a" }}
                />
              </Popconfirm>
            </Tooltip>

            <Tooltip title="Xóa vĩnh viễn">
              <Popconfirm
                title="Xác nhận xóa vĩnh viễn"
                description={
                  <span>
                    Thao tác này <strong>không thể hoàn tác</strong>.
                    <br />
                    Bạn có chắc muốn xóa vĩnh viễn suất chiếu này?
                  </span>
                }
                onConfirm={() => handlePermanentDelete(record._id, label)}
                okText="Xóa vĩnh viễn"
                cancelText="Hủy"
                okType="danger"
              >
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  loading={actionLoading[`delete_${record._id}`]}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <Loading tip="Đang tải thùng rác suất chiếu..." />;

  if (error)
    return <ErrorDisplay message={error} onRetry={fetchTrashShowTimes} />;

  return (
    <>
      {contextHolder}
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/show-times")}
          >
            Quay lại danh sách
          </Button>
          <Title level={4} style={{ margin: 0, color: "#595959" }}>
            🗑️ Thùng rác — Suất chiếu ({showTimes.length})
          </Title>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={showTimes}
            rowKey="_id"
            pagination={{
              current: currentPage,
              pageSize,
              total: showTimes.length,
              showSizeChanger: true,
              showQuickJumper: true,
              size: "small",
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} suất chiếu`,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
            scroll={{ x: 1200 }}
            size="middle"
            locale={{ emptyText: "Thùng rác trống" }}
          />
        </Card>
      </div>
    </>
  );
};

export default ShowTimeTrashPage;