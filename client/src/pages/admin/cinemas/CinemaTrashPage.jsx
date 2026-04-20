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
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  getTrashCinema,
  restoreCinema,
  permanentDeleteCinema,
} from "../../../services/cinemaServices";
import getColumnSearchProps from "../../../helpers/getColumnSearchProps";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";
import "./cinemas.scss";

const { Title } = Typography;

const CinemaTrashPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [cinemas, setCinemas] = useState([]);
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
  const fetchTrashCinemas = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTrashCinema();
      // API có thể trả về array hoặc { data: [] }
      setCinemas(Array.isArray(result) ? result : result.data || []);
    } catch (err) {
      console.error("Error fetching trash cinemas:", err);
      setError(
        err.response?.data?.message || "Không thể tải danh sách rạp đã xóa"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashCinemas();
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleRestore = async (cinemaId, cinemaName) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`restore_${cinemaId}`]: true }));
      await restoreCinema(cinemaId);
      setCinemas((prev) => prev.filter((item) => item._id !== cinemaId));
      messageApi.success(`Đã khôi phục rạp "${cinemaName}" thành công`);
    } catch (err) {
      console.error("Error restoring cinema:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể khôi phục rạp chiếu"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`restore_${cinemaId}`]: false }));
    }
  };

  const handlePermanentDelete = async (cinemaId, cinemaName) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`delete_${cinemaId}`]: true }));
      await permanentDeleteCinema(cinemaId);
      setCinemas((prev) => prev.filter((item) => item._id !== cinemaId));
      messageApi.success(`Đã xóa vĩnh viễn rạp "${cinemaName}"`);
    } catch (err) {
      console.error("Error permanently deleting cinema:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể xóa vĩnh viễn rạp chiếu"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete_${cinemaId}`]: false }));
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const renderCities = (cityIds) => {
    if (!Array.isArray(cityIds) || cityIds.length === 0) return "—";
    return (
      <Space wrap size={2}>
        {cityIds.map((city, idx) => (
          <Tag key={idx} color="blue" icon={<EnvironmentOutlined />}>
            {typeof city === "object" ? city.name : city}
          </Tag>
        ))}
      </Space>
    );
  };

  const renderParentCinema = (parentId) => {
    if (!parentId) return <Tag color="gold">Rạp gốc</Tag>;
    return (
      <Tag color="purple">
        {typeof parentId === "object" ? parentId.name : "Rạp con"}
      </Tag>
    );
  };

  // ─── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Tên rạp",
      dataIndex: "name",
      key: "name",
      width: 200,
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
          <div style={{ fontWeight: "bold", marginBottom: 2 }}>{name}</div>
          <div style={{ fontSize: 11, color: "#999" }}>
            ID: {record._id.slice(-8)}
          </div>
        </div>
      ),
    },
    {
      title: "Thuộc cụm rạp",
      dataIndex: "parentId",
      key: "parentId",
      width: 160,
      render: renderParentCinema,
    },
    {
      title: "Thành phố",
      dataIndex: "cityIds",
      key: "cityIds",
      width: 160,
      render: renderCities,
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
      title: "Hành động",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Khôi phục">
            <Popconfirm
              title="Xác nhận khôi phục"
              description={`Khôi phục rạp "${record.name}"?`}
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
                  Bạn có chắc muốn xóa vĩnh viễn rạp "{record.name}"?
                </span>
              }
              onConfirm={() =>
                handlePermanentDelete(record._id, record.name)
              }
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
  if (loading) return <Loading tip="Đang tải thùng rác rạp chiếu..." />;

  if (error)
    return <ErrorDisplay message={error} onRetry={fetchTrashCinemas} />;

  return (
    <>
      {contextHolder}
      <div className="trash-page">
        <div className="trash-page__header">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/cinemas")}
          >
            Quay lại danh sách
          </Button>
          <Title level={4} className="trash-page__title">
            🗑️ Thùng rác — Rạp chiếu ({cinemas.length})
          </Title>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={cinemas}
            rowKey="_id"
            pagination={{
              current: currentPage,
              pageSize,
              total: cinemas.length,
              showSizeChanger: true,
              showQuickJumper: true,
              size: "small",
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} rạp chiếu`,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
            scroll={{ x: 1100 }}
            size="middle"
            style={{ background: "#fff", borderRadius: 8 }}
            locale={{ emptyText: "Thùng rác trống" }}
          />
        </Card>
      </div>
    </>
  );
};

export default CinemaTrashPage;