import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  message,
  Tooltip,
  Image,
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
  getTrashFilms,
  restoreFilm,
  deleteFilmPermanent,
} from "../../../services/filmServices";
import getColumnSearchProps from "../../../helpers/getColumnSearchProps";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";
import "./films.scss";

const { Title } = Typography;

const FilmTrashPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [films, setFilms] = useState([]);
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
  const fetchTrashFilms = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTrashFilms();
      setFilms(result.data || []);
    } catch (err) {
      console.error("Error fetching trash films:", err);
      setError(
        err.response?.data?.message || "Không thể tải danh sách phim đã xóa"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashFilms();
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleRestore = async (filmId, filmTitle) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`restore_${filmId}`]: true }));
      await restoreFilm(filmId);
      setFilms((prev) => prev.filter((item) => item._id !== filmId));
      messageApi.success(`Đã khôi phục phim "${filmTitle}" thành công`);
    } catch (err) {
      console.error("Error restoring film:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể khôi phục phim"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`restore_${filmId}`]: false }));
    }
  };

  const handlePermanentDelete = async (filmId, filmTitle) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`delete_${filmId}`]: true }));
      await deleteFilmPermanent(filmId);
      setFilms((prev) => prev.filter((item) => item._id !== filmId));
      messageApi.success(`Đã xóa vĩnh viễn phim "${filmTitle}"`);
    } catch (err) {
      console.error("Error permanently deleting film:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể xóa vĩnh viễn phim"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete_${filmId}`]: false }));
    }
  };

  // ─── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Ảnh bìa",
      dataIndex: "thumbnail",
      key: "thumbnail",
      width: 100,
      align: "center",
      render: (thumbnail, record) => (
        <Image
          src={thumbnail}
          alt={record.title}
          width={60}
          height={90}
          style={{ objectFit: "cover", borderRadius: 6 }}
          preview={{ mask: <span style={{ fontSize: 11 }}>Xem</span> }}
        />
      ),
    },
    {
      title: "Tên phim",
      dataIndex: "title",
      key: "title",
      ...getColumnSearchProps(
        "title",
        searchText,
        setSearchText,
        searchedColumn,
        setSearchedColumn,
        searchInput
      ),
      render: (title) => (
        <div style={{ fontWeight: "bold", maxWidth: 200 }}>{title}</div>
      ),
    },
    {
      title: "Thời lượng",
      dataIndex: "duration",
      key: "duration",
      width: 110,
      align: "center",
      render: (duration) => `${duration} phút`,
    },
    {
      title: "Khởi chiếu",
      dataIndex: "releaseDate",
      key: "releaseDate",
      align: "center",
      width: 130,
      sorter: (a, b) => dayjs(a.releaseDate).unix() - dayjs(b.releaseDate).unix(),
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Định dạng",
      dataIndex: "availableFormats",
      key: "availableFormats",
      width: 140,
      render: (formats) => (
        <Space wrap size={2}>
          {formats?.map((fmt) => (
            <Tag key={fmt} color="blue">
              {fmt}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "G.hạn tuổi",
      dataIndex: "ageRating",
      key: "ageRating",
      width: 90,
      align: "center",
      render: (ageRating) => <Tag color="orange">{ageRating}</Tag>,
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
              description={`Khôi phục phim "${record.title}"?`}
              onConfirm={() => handleRestore(record._id, record.title)}
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
                  Bạn có chắc muốn xóa vĩnh viễn phim "{record.title}"?
                </span>
              }
              onConfirm={() => handlePermanentDelete(record._id, record.title)}
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
  if (loading) return <Loading tip="Đang tải thùng rác phim..." />;

  if (error) return <ErrorDisplay message={error} onRetry={fetchTrashFilms} />;

  return (
    <>
      {contextHolder}
      <div className="trash-page">
        <div className="trash-page__header">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/films")}
          >
            Quay lại danh sách
          </Button>
          <Title level={4} className="trash-page__title">
            🗑️ Thùng rác — Phim ({films.length})
          </Title>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={films}
            rowKey="_id"
            pagination={{
              current: currentPage,
              pageSize,
              total: films.length,
              showSizeChanger: true,
              showQuickJumper: true,
              size: "small",
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} phim`,
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

export default FilmTrashPage;