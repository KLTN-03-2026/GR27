import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  message,
  Tooltip,
  Row,
  Col,
  Select,
  Card,
  DatePicker,
  TreeSelect,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { deleteShowTime } from "../../../services/showTimeServices";
import { getAllFilms } from "../../../services/filmServices";
import { getAllCity } from "../../../services/cityServices";
import { getAllCinema } from "../../../services/cinemaServices";
import { getAllRooms } from "../../../services/roomServices";
import getColumnSearchProps from "../../../helpers/getColumnSearchProps";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";
import "./showtimes.scss";

const { RangePicker } = DatePicker;

const ShowTimeListPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [showTimes, setShowTimes] = useState([]);
  const [films, setFilms] = useState([]);
  const [cities, setCities] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Server-side pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Filter states
  const [selectedFilmId, setSelectedFilmId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedCinemaId, setSelectedCinemaId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  // Search states
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  // ─── Fetch reference data ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchReferenceData = async () => {
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
        console.error("Error fetching reference data:", err);
      }
    };
    fetchReferenceData();
  }, []);

  // ─── Fetch showtimes (server-side pagination) ────────────────────────────────
  const fetchShowTimes = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append("page", page.toString());
        if (selectedFilmId) params.append("filmId", selectedFilmId);
        if (selectedCinemaId) params.append("cinemaId", selectedCinemaId);
        if (selectedRoomId) params.append("roomId", selectedRoomId);
        if (selectedStatus) params.append("status", selectedStatus);
        if (dateRange && dateRange[0] && dateRange[1]) {
          params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
          params.append("endDate", dateRange[1].format("YYYY-MM-DD"));
        }

        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/show-times?${params.toString()}`,
          { credentials: "include" }
        );
        const result = await response.json();

        if (result.code === 200) {
          setShowTimes(result.data || []);
          setPagination({
            current: result.pagination.page,
            pageSize: result.pagination.limit,
            total: result.pagination.total,
          });
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        console.error("Error fetching showtimes:", err);
        setError(err.message || "Không thể tải danh sách suất chiếu");
      } finally {
        setLoading(false);
      }
    },
    [selectedFilmId, selectedCinemaId, selectedRoomId, selectedStatus, dateRange]
  );

  useEffect(() => {
    fetchShowTimes(1);
  }, [fetchShowTimes]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
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

  const getFilteredCinemaTree = () => {
    if (!selectedCityId) return buildCinemaTree(cinemas);
    const filtered = cinemas.filter((cinema) => {
      if (!cinema.cityIds) return false;
      return cinema.cityIds.some((cityId) => {
        const cityIdValue =
          typeof cityId === "object" ? cityId._id : cityId;
        return cityIdValue === selectedCityId;
      });
    });
    return buildCinemaTree(filtered);
  };

  const getFilteredRooms = () => {
    if (!selectedCinemaId) return [];
    return rooms
      .filter((room) => {
        const roomCinemaId =
          typeof room.cinemaId === "object"
            ? room.cinemaId._id
            : room.cinemaId;
        return roomCinemaId === selectedCinemaId;
      })
      .map((room) => ({ label: room.name, value: room._id }));
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setSelectedFilmId(null);
    setSelectedCityId(null);
    setSelectedCinemaId(null);
    setSelectedRoomId(null);
    setSelectedStatus(null);
    setDateRange(null);
  };

  const handleCityChange = (value) => {
    setSelectedCityId(value);
    setSelectedCinemaId(null);
    setSelectedRoomId(null);
  };

  const handleCinemaChange = (value) => {
    setSelectedCinemaId(value);
    setSelectedRoomId(null);
  };

  const handleDelete = async (showtimeId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`delete_${showtimeId}`]: true }));
      await deleteShowTime(showtimeId);
      messageApi.success("Xóa suất chiếu thành công");
      fetchShowTimes(pagination.current);
    } catch (err) {
      console.error("Error deleting showtime:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể xóa suất chiếu"
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`delete_${showtimeId}`]: false,
      }));
    }
  };

  const handleTableChange = (newPagination) => {
    fetchShowTimes(newPagination.current);
  };

  // ─── Render helpers ─────────────────────────────────────────────────────────
  const renderStatusTag = (status) => {
    const config =
      status === "active"
        ? { color: "green", text: "Hoạt động", icon: <CheckCircleOutlined /> }
        : {
            color: "red",
            text: "Ngưng hoạt động",
            icon: <CloseCircleOutlined />,
          };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const renderFilmInfo = (filmId) => {
    if (!filmId) return "N/A";
    return typeof filmId === "object" ? filmId.title : filmId;
  };

  const renderCinemaInfo = (cinemaId) => {
    if (!cinemaId) return "N/A";
    return typeof cinemaId === "object" ? cinemaId.name : cinemaId;
  };

  const renderRoomInfo = (roomId) => {
    if (!roomId) return "N/A";
    return typeof roomId === "object" ? roomId.name : roomId;
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
      render: (filmId, record) => (
        <div>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
            {renderFilmInfo(filmId)}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            ID: {record._id.slice(-8)}
          </div>
        </div>
      ),
    },
    {
      title: "Ngày giờ chiếu",
      key: "showTime",
      width: 160,
      align: "center",
      render: (_, record) => (
        <div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "14px",
              marginBottom: "4px",
              color: "#1890ff",
            }}
          >
            <ClockCircleOutlined />{" "}
            {dayjs(record.startTime).format("HH:mm")} -{" "}
            {dayjs(record.endTime).format("HH:mm")}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            <CalendarOutlined />{" "}
            {dayjs(record.startTime).format("DD/MM/YYYY")}
          </div>
        </div>
      ),
    },
    {
      title: "Phòng chiếu",
      dataIndex: "roomId",
      key: "roomId",
      width: 120,
      align: "center",
      render: renderRoomInfo,
    },
    {
      title: "Rạp chiếu",
      dataIndex: "cinemaId",
      key: "cinemaId",
      width: 180,
      render: renderCinemaInfo,
    },
    {
      title: "Định dạng",
      dataIndex: "format",
      key: "format",
      width: 100,
      align: "center",
      render: (format) => (
        <Tag color="cyan" style={{ fontSize: "13px" }}>
          {format}
        </Tag>
      ),
    },
    {
      title: "Tổng số ghế",
      key: "totalSeats",
      width: 120,
      align: "center",
      sorter: true,
      render: (_, record) => (
        <Tag color="blue" style={{ fontSize: "14px", fontWeight: "bold" }}>
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
      sorter: true,
      render: renderStatusTag,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 150,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/admin/show-times/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="default"
              icon={<EditOutlined />}
              size="small"
              onClick={() => navigate(`/admin/show-times/edit/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc muốn xóa suất chiếu này?"
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
  if (loading && pagination.current === 1) {
    return <Loading tip="Đang tải danh sách suất chiếu..." />;
  }

  if (error && showTimes.length === 0) {
    return <ErrorDisplay message={error} onRetry={() => fetchShowTimes(1)} />;
  }

  return (
    <>
      {contextHolder}
      <div style={{ padding: "20px" }}>
        {/* Header */}
        <Card style={{ marginBottom: "20px" }}>
          <Row gutter={[16, 16]} align="middle">
            <Col>
              <Link to="/admin/show-times/create">
                <Button
                  color="primary"
                  variant="outlined"
                  icon={<PlusOutlined />}
                  size="large"
                >
                  Tạo suất chiếu mới
                </Button>
              </Link>
            </Col>
          </Row>
        </Card>

        {/* Filters */}
        <Card title="Bộ lọc" style={{ marginBottom: "20px" }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Lọc theo phim"
                style={{ width: "100%" }}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                value={selectedFilmId}
                onChange={setSelectedFilmId}
                options={films
                  .filter((film) => film.status === "active")
                  .map((film) => ({ label: film.title, value: film._id }))}
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <RangePicker
                placeholder={["Từ ngày", "Đến ngày"]}
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                value={dateRange}
                onChange={setDateRange}
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Lọc theo thành phố"
                style={{ width: "100%" }}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                value={selectedCityId}
                onChange={handleCityChange}
                options={cities.map((city) => ({
                  label: city.name,
                  value: city._id,
                }))}
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <TreeSelect
                showSearch
                placeholder="Lọc theo rạp chiếu"
                style={{ width: "100%" }}
                allowClear
                treeDefaultExpandAll
                treeData={getFilteredCinemaTree()}
                value={selectedCinemaId}
                onChange={handleCinemaChange}
                disabled={!selectedCityId}
                dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                notFoundContent={
                  !selectedCityId
                    ? "Vui lòng chọn thành phố trước"
                    : "Không có rạp nào"
                }
                filterTreeNode={(input, treeNode) =>
                  treeNode.title.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Lọc theo phòng chiếu"
                style={{ width: "100%" }}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                value={selectedRoomId}
                onChange={setSelectedRoomId}
                disabled={!selectedCinemaId}
                options={getFilteredRooms()}
                notFoundContent={
                  !selectedCinemaId
                    ? "Vui lòng chọn rạp chiếu trước"
                    : "Không có phòng chiếu nào"
                }
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                placeholder="Lọc theo trạng thái"
                style={{ width: "100%" }}
                allowClear
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: "active", label: "Hoạt động" },
                  { value: "inactive", label: "Ngưng hoạt động" },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
                block
              >
                Reset bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table
            ShowTimeListPage dùng server-side pagination thực sự (fetch API theo từng page)
            → Không thể tắt built-in pagination. Dùng showTotal để render nút Thùng rác
            vào slot bên trái thông qua flex wrapper trên .ant-table-pagination.
        */}
        <Card
       
        
        >
          <Table
            columns={columns}
            dataSource={showTimes}
            rowKey="_id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: false,
              showQuickJumper: true,
              size: "small",
              showTotal: (total, range) => (
                <div className="showtime-list__pagination-total">
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    
                    onClick={() => navigate("/admin/show-times/trash")}
                  >
                    Thùng rác
                  </Button>
                  <span>
                    {range[0]}-{range[1]} của {total} suất chiếu
                  </span>
                </div>
              ),
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            size="middle"
            locale={{
              emptyText: "Không tìm thấy suất chiếu nào phù hợp với bộ lọc",
            }}
          />
        </Card>
      </div>
    </>
  );
};

export default ShowTimeListPage;