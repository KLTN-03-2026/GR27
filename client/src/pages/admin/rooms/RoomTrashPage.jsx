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
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  getTrashRooms,
  restoreRoom,
  permanentDeleteRoom,
} from "../../../services/roomServices";
import getColumnSearchProps from "../../../helpers/getColumnSearchProps";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";

const { Title } = Typography;

const RoomTrashPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Pagination state (FE tự xử lý)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search states
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTrashRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTrashRooms();
      // roomServices trả về { data: [] } giống pattern cũ
      setRooms(result.data || []);
    } catch (err) {
      console.error("Error fetching trash rooms:", err);
      setError(
        err.response?.data?.message || "Không thể tải danh sách phòng chiếu đã xóa"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashRooms();
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleRestore = async (roomId, roomName) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`restore_${roomId}`]: true }));
      await restoreRoom(roomId);
      setRooms((prev) => prev.filter((item) => item._id !== roomId));
      messageApi.success(`Đã khôi phục phòng chiếu "${roomName}" thành công`);
    } catch (err) {
      console.error("Error restoring room:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể khôi phục phòng chiếu"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`restore_${roomId}`]: false }));
    }
  };

  const handlePermanentDelete = async (roomId, roomName) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`delete_${roomId}`]: true }));
      await permanentDeleteRoom(roomId);
      setRooms((prev) => prev.filter((item) => item._id !== roomId));
      messageApi.success(`Đã xóa vĩnh viễn phòng chiếu "${roomName}"`);
    } catch (err) {
      console.error("Error permanently deleting room:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể xóa vĩnh viễn phòng chiếu"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete_${roomId}`]: false }));
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const renderCinemaInfo = (cinemaId) => {
    if (!cinemaId) return "—";
    return typeof cinemaId === "object" ? cinemaId.name : cinemaId;
  };

  const renderCities = (cinemaId) => {
    if (!cinemaId || typeof cinemaId !== "object" || !cinemaId.cityIds) return "—";
    const cities = cinemaId.cityIds;
    if (!Array.isArray(cities) || cities.length === 0) return "—";
    return (
      <Space wrap size={2}>
        {cities.map((city, idx) => (
          <Tag key={idx} color="blue">
            {typeof city === "object" ? city.name : city}
          </Tag>
        ))}
      </Space>
    );
  };

  // ─── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Tên phòng chiếu",
      dataIndex: "name",
      key: "name",
      width: 180,
      ...getColumnSearchProps(
        "name",
        searchText,
        setSearchText,
        searchedColumn,
        setSearchedColumn,
        searchInput
      ),
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 12, color: "#666" }}>
            ID: {record._id.slice(-8)}
          </div>
        </div>
      ),
    },
    {
      title: "Số ghế",
      key: "seatCount",
      width: 100,
      align: "center",
      sorter: (a, b) => (a.seatLayout?.length || 0) - (b.seatLayout?.length || 0),
      render: (_, record) => (
        <Tag color="cyan" style={{ fontSize: 14, fontWeight: "bold" }}>
          {record.seatLayout?.length || 0}
        </Tag>
      ),
    },
    {
      title: "Thuộc rạp chiếu",
      dataIndex: "cinemaId",
      key: "cinemaId",
      width: 200,
      render: renderCinemaInfo,
    },
    {
      title: "Thành phố",
      key: "cities",
      width: 150,
      render: (_, record) => renderCities(record.cinemaId),
    },
    {
      title: "Định dạng hỗ trợ",
      dataIndex: "supportedFormats",
      key: "supportedFormats",
      width: 150,
      render: (formats) => {
        if (!formats || formats.length === 0) return "N/A";
        return (
          <Space wrap size={2}>
            {formats.map((fmt, idx) => (
              <Tag key={idx} color="blue">
                {fmt}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      align: "center",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "Hoạt động" : "Ngưng hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thời gian",
      key: "time",
      width: 160,
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div>
            <strong>Tạo:</strong> {dayjs(record.createdAt).format("DD/MM/YYYY")}
          </div>
          <div>
            <strong>Cập nhật:</strong>{" "}
            {dayjs(record.updatedAt).format("DD/MM/YYYY")}
          </div>
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Khôi phục">
            <Popconfirm
              title="Xác nhận khôi phục"
              description={`Khôi phục phòng chiếu "${record.name}"?`}
              onConfirm={() => handleRestore(record._id, record.name)}
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
                  Bạn có chắc muốn xóa vĩnh viễn phòng "{record.name}"?
                </span>
              }
              onConfirm={() => handlePermanentDelete(record._id, record.name)}
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
      ),
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <Loading tip="Đang tải thùng rác phòng chiếu..." />;

  if (error) return <ErrorDisplay message={error} onRetry={fetchTrashRooms} />;

  return (
    <>
      {contextHolder}
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/rooms")}
          >
            Quay lại danh sách
          </Button>
          <Title level={4} style={{ margin: 0, color: "#595959" }}>
            🗑️ Thùng rác — Phòng chiếu ({rooms.length})
          </Title>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={rooms}
            rowKey="_id"
            pagination={{
              current: currentPage,
              pageSize,
              total: rooms.length,
              showSizeChanger: true,
              showQuickJumper: true,
              size: "small",
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} phòng chiếu`,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
            scroll={{ x: 1100 }}
            size="middle"
            locale={{ emptyText: "Thùng rác trống" }}
          />
        </Card>
      </div>
    </>
  );
};

export default RoomTrashPage;