import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Table,
  Image,
  Tag,
  Space,
  Popconfirm,
  message,
  Tooltip,
  Pagination,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import getColumnSearchProps from "../../../helpers/getColumnSearchProps";
import {
  getAllFilms,
  deleteFilm,
  updateFilmStatus,
  updateFilmTrending,
} from "../../../services/filmServices";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";
import "./films.scss";

const FilmListPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchFilms = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllFilms();
      setFilms(result.data || []);
    } catch (err) {
      console.error("Error fetching films:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách phim");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilms();
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleStatusToggle = async (film) => {
    const filmId = film._id;
    const newStatus = film.status === "active" ? "inactive" : "active";
    try {
      setActionLoading((prev) => ({ ...prev, [`status_${filmId}`]: true }));
      await updateFilmStatus(filmId, newStatus);
      setFilms((prev) =>
        prev.map((item) =>
          item._id === filmId ? { ...item, status: newStatus } : item
        )
      );
      messageApi.success(
        `Đã ${newStatus === "active" ? "kích hoạt" : "vô hiệu hóa"} phim thành công`
      );
    } catch (err) {
      messageApi.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`status_${filmId}`]: false }));
    }
  };

  const handleTrendingToggle = async (film) => {
    const filmId = film._id;
    const newTrending = !film.isTrending;
    try {
      setActionLoading((prev) => ({ ...prev, [`trending_${filmId}`]: true }));
      await updateFilmTrending(filmId, newTrending);
      setFilms((prev) =>
        prev.map((item) =>
          item._id === filmId ? { ...item, isTrending: newTrending } : item
        )
      );
      messageApi.success(
        `Đã ${newTrending ? "đánh dấu" : "bỏ đánh dấu"} phim thịnh hành`
      );
    } catch (err) {
      messageApi.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái thịnh hành"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`trending_${filmId}`]: false }));
    }
  };

  const handleDelete = async (filmId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`delete_${filmId}`]: true }));
      await deleteFilm(filmId);
      setFilms((prev) => prev.filter((item) => item._id !== filmId));
      messageApi.success("Xóa phim thành công");
    } catch (err) {
      messageApi.error(err.response?.data?.message || "Không thể xóa phim");
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
      width: 120,
      align: "center",
      render: (thumbnail, record) => (
        <Image
          src={thumbnail}
          alt={record.title}
          width={80}
          height={120}
          style={{ objectFit: "cover", borderRadius: 8 }}
          preview={{ mask: <span style={{ fontSize: 12 }}>Xem ảnh</span> }}
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
      width: 120,
      align: "center",
      render: (duration) => `${duration} phút`,
    },
    {
      title: "Khởi chiếu",
      dataIndex: "releaseDate",
      key: "releaseDate",
      align: "center",
      width: 160,
      sorter: (a, b) =>
        dayjs(a.releaseDate).unix() - dayjs(b.releaseDate).unix(),
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Định dạng",
      dataIndex: "availableFormats",
      key: "availableFormats",
      width: 150,
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
      width: 100,
      align: "center",
      render: (ageRating) => <Tag color="orange">{ageRating}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      filters: [
        { text: "Hoạt động", value: "active" },
        { text: "Ngưng hoạt động", value: "inactive" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status, record) => (
        <Tag
          color={status === "active" ? "green" : "red"}
          style={{ cursor: "pointer" }}
          onClick={() => handleStatusToggle(record)}
        >
          {actionLoading[`status_${record._id}`]
            ? "Đang cập nhật..."
            : status === "active"
            ? "Hoạt động"
            : "Ngưng hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thịnh hành",
      dataIndex: "isTrending",
      key: "isTrending",
      width: 120,
      align: "center",
      filters: [
        { text: "Thịnh hành", value: true },
        { text: "Bình thường", value: false },
      ],
      onFilter: (value, record) => record.isTrending === value,
      render: (isTrending, record) => (
        <Tag
          color={isTrending ? "volcano" : "default"}
          style={{ cursor: "pointer" }}
          onClick={() => handleTrendingToggle(record)}
        >
          {actionLoading[`trending_${record._id}`]
            ? "Đang cập nhật..."
            : isTrending
            ? "Thịnh hành"
            : "Bình thường"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 130,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/admin/films/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="default"
              icon={<EditOutlined />}
              size="small"
              onClick={() => navigate(`/admin/films/edit/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xác nhận xóa"
              description={`Bạn có chắc muốn xóa phim "${record.title}"?`}
              onConfirm={() => handleDelete(record._id)}
              okText="Xóa"
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
  if (loading) return <Loading tip="Đang tải danh sách phim..." />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchFilms} />;

  return (
    <>
      {contextHolder}

      <div style={{ marginBottom: 16 }}>
        <Link to="/admin/films/create">
          <Button variant="outlined" color="primary" icon={<PlusOutlined />}>
            Tạo phim mới
          </Button>
        </Link>
      </div>

      {/* Table tắt pagination mặc định để tự render pagination row bên dưới */}
      <Table
        columns={columns}
        dataSource={films.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
        rowKey="_id"
        pagination={false}
        scroll={{ x: 1200 }}
        size="middle"
        style={{ background: "#fff", borderRadius: 8 }}
      />

      {/* Dòng cuối: Thùng rác (trái) | Pagination (phải) — cùng hàng */}
      <div className="film-list__pagination-row">
        <Button
          icon={<DeleteOutlined />}
          danger
          onClick={() => navigate("/admin/films/trash")}
        >
          Thùng rác
        </Button>

        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={films.length}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} của ${total} phim`
          }
          pageSizeOptions={["10", "20", "50", "100"]}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
        />
      </div>
    </>
  );
};

export default FilmListPage;