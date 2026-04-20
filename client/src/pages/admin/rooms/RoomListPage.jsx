import React, { useState, useEffect, useRef } from "react";
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
  TreeSelect,
  Pagination,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  deleteRoom,
  getAllRooms,
  updateRoomStatus,
} from "../../../services/roomServices";
import { getAllCity } from "../../../services/cityServices";
import { getAllCinema } from "../../../services/cinemaServices";
import getColumnSearchProps from "../../../helpers/getColumnSearchProps";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";
import "./rooms.scss";

const RoomListPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [cities, setCities] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Filter states
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedCinemas, setSelectedCinemas] = useState([]);
  const [selectedFormats, setSelectedFormats] = useState([]);

  // Pagination state (FE tự xử lý)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search states
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const [roomResult, cityResult, cinemaResult] = await Promise.all([
        getAllRooms(),
        getAllCity(),
        getAllCinema(),
      ]);

      setRooms(roomResult.data.reverse() || []);
      setFilteredRooms(roomResult.data.reverse() || []);
      setCities(cityResult || []);
      setCinemas(cinemaResult || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        err.response?.data?.message || "Không thể tải danh sách phòng chiếu"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // ─── Filter effect ───────────────────────────────────────────────────────────
  useEffect(() => {
    let filtered = [...rooms];

    if (selectedCities.length > 0) {
      filtered = filtered.filter((room) => {
        if (!room.cinemaId || !room.cinemaId.cityIds) return false;
        const cinemaCityIds = room.cinemaId.cityIds.map((city) =>
          typeof city === "object" ? city._id : city
        );
        return cinemaCityIds.some((cityId) => selectedCities.includes(cityId));
      });
    }

    if (selectedCinemas.length > 0) {
      filtered = filtered.filter((room) => {
        const cinemaId =
          typeof room.cinemaId === "object" ? room.cinemaId._id : room.cinemaId;
        return selectedCinemas.includes(cinemaId);
      });
    }

    if (selectedFormats.length > 0) {
      filtered = filtered.filter((room) => {
        if (!room.supportedFormats || room.supportedFormats.length === 0)
          return false;
        return room.supportedFormats.some((format) =>
          selectedFormats.includes(format)
        );
      });
    }

    setFilteredRooms(filtered);
    setCurrentPage(1); // Reset trang khi filter thay đổi
  }, [rooms, selectedCities, selectedCinemas, selectedFormats]);

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
    if (selectedCities.length === 0) return buildCinemaTree(cinemas);

    const filtered = cinemas.filter((cinema) => {
      if (!cinema.cityIds) return false;
      return cinema.cityIds.some((cityId) => {
        const cityIdValue =
          typeof cityId === "object" ? cityId._id : cityId;
        return selectedCities.includes(cityIdValue);
      });
    });

    return buildCinemaTree(filtered);
  };

  const handleResetFilters = () => {
    setSelectedCities([]);
    setSelectedCinemas([]);
    setSelectedFormats([]);
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleStatusToggle = async (room) => {
    const roomId = room._id;
    const newStatus = room.status === "active" ? "inactive" : "active";
    try {
      setActionLoading((prev) => ({ ...prev, [`status_${roomId}`]: true }));
      await updateRoomStatus(roomId, newStatus);
      setRooms((prev) =>
        prev.map((item) =>
          item._id === roomId ? { ...item, status: newStatus } : item
        )
      );
      messageApi.success(
        `Đã ${newStatus === "active" ? "kích hoạt" : "vô hiệu hóa"} phòng chiếu thành công`
      );
    } catch (err) {
      console.error("Error updating status:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`status_${roomId}`]: false }));
    }
  };

  const handleDelete = async (roomId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`delete_${roomId}`]: true }));
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((item) => item._id !== roomId));
      messageApi.success("Xóa phòng chiếu thành công");
    } catch (err) {
      console.error("Error deleting room:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể xóa phòng chiếu"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete_${roomId}`]: false }));
    }
  };

  // ─── Render helpers ─────────────────────────────────────────────────────────
  const renderStatusTag = (status, record) => {
    const statusConfig = {
      active: { color: "green", text: "Hoạt động", icon: <CheckCircleOutlined /> },
      inactive: { color: "red", text: "Ngưng hoạt động", icon: <CloseCircleOutlined /> },
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <Tag
        color={config.color}
        icon={config.icon}
        style={{ cursor: "pointer" }}
        onClick={() => handleStatusToggle(record)}
      >
        {actionLoading[`status_${record._id}`] ? "Đang cập nhật..." : config.text}
      </Tag>
    );
  };

  const renderCinemaInfo = (cinemaId) => {
    if (!cinemaId) return "Chưa cập nhật";
    return typeof cinemaId === "object" ? cinemaId.name : cinemaId;
  };

  const renderCities = (cinemaId) => {
    if (!cinemaId || typeof cinemaId !== "object" || !cinemaId.cityIds)
      return "Chưa cập nhật";
    const cityList = cinemaId.cityIds;
    if (!Array.isArray(cityList) || cityList.length === 0) return "Chưa cập nhật";
    return (
      <Space wrap>
        {cityList.map((city, index) => (
          <Tag key={index} color="blue">
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
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{name}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
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
        <Tag color="cyan" style={{ fontSize: "14px", fontWeight: "bold" }}>
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
          <Space wrap>
            {formats.map((format, index) => (
              <Tag key={index} color="blue">
                {format}
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
      width: 140,
      align: "center",
      filters: [
        { text: "Hoạt động", value: "active" },
        { text: "Ngưng hoạt động", value: "inactive" },
      ],
      onFilter: (value, record) => record.status === value,
      render: renderStatusTag,
    },
    {
      title: "Thời gian",
      key: "time",
      width: 160,
      render: (_, record) => (
        <div style={{ fontSize: "12px" }}>
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
              onClick={() => navigate(`/admin/rooms/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="default"
              icon={<EditOutlined />}
              size="small"
              onClick={() => navigate(`/admin/rooms/edit/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xác nhận xóa"
              description={`Bạn có chắc muốn xóa phòng chiếu "${record.name}"?`}
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
  if (loading) return <Loading tip="Đang tải danh sách phòng chiếu..." />;

  if (error) return <ErrorDisplay message={error} onRetry={fetchRooms} />;

  const pagedData = filteredRooms.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      {contextHolder}
      <div style={{ padding: "20px" }}>
        {/* Header + Filters */}
        <Card style={{ marginBottom: "20px" }}>
          <Row gutter={[16, 16]} align="middle">
            <Col>
              <Link to="/admin/rooms/create">
                <Button
                  color="primary"
                  variant="outlined"
                  icon={<PlusOutlined />}
                  size="large"
                >
                  Tạo phòng chiếu mới
                </Button>
              </Link>
            </Col>

            <Col flex="auto">
              <Row gutter={[12, 12]} justify="end">
                <Col>
                  <Select
                    mode="multiple"
                    placeholder="Lọc theo thành phố"
                    style={{ width: 250 }}
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    value={selectedCities}
                    onChange={(values) => {
                      setSelectedCities(values);
                      if (values.length === 0) setSelectedCinemas([]);
                    }}
                    options={cities.map((city) => ({
                      label: city.name,
                      value: city._id,
                    }))}
                  />
                </Col>

                <Col>
                  <TreeSelect
                    showSearch
                    treeCheckable
                    placeholder="Lọc theo rạp chiếu"
                    style={{ width: 300 }}
                    allowClear
                    treeDefaultExpandAll
                    maxTagCount={2}
                    treeData={getFilteredCinemaTree()}
                    value={selectedCinemas}
                    onChange={setSelectedCinemas}
                    disabled={selectedCities.length === 0}
                    dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                    notFoundContent={
                      selectedCities.length === 0
                        ? "Vui lòng chọn thành phố trước"
                        : "Không có rạp nào"
                    }
                    filterTreeNode={(input, treeNode) =>
                      treeNode.title.toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Col>

                <Col>
                  <Select
                    mode="multiple"
                    placeholder="Lọc theo định dạng"
                    style={{ width: 200 }}
                    allowClear
                    value={selectedFormats}
                    onChange={setSelectedFormats}
                    options={[
                      { value: "2D", label: "2D" },
                      { value: "3D", label: "3D" },
                      { value: "IMAX", label: "IMAX" },
                      { value: "4DX", label: "4DX" },
                    ]}
                  />
                </Col>

                <Col>
                  <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                    Reset bộ lọc
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={pagedData}
            rowKey="_id"
            pagination={false}
            scroll={{ x: 1000 }}
            size="middle"
            locale={{
              emptyText:
                selectedCities.length > 0 ||
                selectedCinemas.length > 0 ||
                selectedFormats.length > 0 ||
                searchText
                  ? "Không tìm thấy phòng chiếu phù hợp với bộ lọc"
                  : "Chưa có phòng chiếu nào",
            }}
          />

          {/* Dòng cuối: Thùng rác (trái) | Pagination (phải) */}
          <div className="room-list__pagination-row">
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => navigate("/admin/rooms/trash")}
            >
              Thùng rác
            </Button>

            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredRooms.length}
              showSizeChanger
              showQuickJumper
              size="small"
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} của ${total} phòng chiếu`
              }
              pageSizeOptions={["10", "20", "50", "100"]}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
            />
          </div>
        </Card>
      </div>
    </>
  );
};

export default RoomListPage;