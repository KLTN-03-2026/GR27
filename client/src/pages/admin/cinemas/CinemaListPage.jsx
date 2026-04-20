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
  Pagination,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  deleteCinema,
  getAllCinema,
  updateCinemaStatus,
} from "../../../services/cinemaServices";
import { getAllCity } from "../../../services/cityServices";
import getColumnSearchProps from "../../../helpers/getColumnSearchProps";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";
import "./cinemas.scss";

const CinemaListPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [cinemas, setCinemas] = useState([]);
  const [filteredCinemas, setFilteredCinemas] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Filter states
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedParents, setSelectedParents] = useState([]);
  const [showParentOnly, setShowParentOnly] = useState(false);

  // Custom pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search states
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCinemas = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cinemaResult, cityResult] = await Promise.all([
        getAllCinema(),
        getAllCity(),
      ]);
      setCinemas(cinemaResult.reverse() || []);
      setFilteredCinemas(cinemaResult.reverse() || []);
      setCities(cityResult || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        err.response?.data?.message || "Không thể tải danh sách rạp chiếu"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCinemas();
  }, []);

  // ─── Filter effect ───────────────────────────────────────────────────────────
  useEffect(() => {
    let filtered = [...cinemas];

    if (showParentOnly) {
      filtered = filtered.filter((cinema) => !cinema.parentId);
    } else {
      filtered = filtered.filter((cinema) => cinema.parentId);
    }

    if (selectedCities.length > 0) {
      filtered = filtered.filter((cinema) => {
        if (Array.isArray(cinema.cityIds)) {
          return cinema.cityIds.some((cityId) => {
            const cityIdValue =
              typeof cityId === "object" ? cityId._id : cityId;
            return selectedCities.includes(cityIdValue);
          });
        }
        return false;
      });
    }

    if (selectedParents.length > 0) {
      filtered = filtered.filter((cinema) => {
        const parentId =
          typeof cinema.parentId === "object"
            ? cinema.parentId?._id
            : cinema.parentId;
        return selectedParents.includes(parentId);
      });
    }

    setFilteredCinemas(filtered);
    setCurrentPage(1); // Reset về trang 1 khi filter thay đổi
  }, [cinemas, selectedCities, selectedParents, showParentOnly]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleStatusToggle = async (cinema) => {
    const cinemaId = cinema._id;
    const newStatus = cinema.status === "active" ? "inactive" : "active";
    try {
      setActionLoading((prev) => ({ ...prev, [`status_${cinemaId}`]: true }));
      await updateCinemaStatus(cinemaId, newStatus);
      setCinemas((prev) =>
        prev.map((item) =>
          item._id === cinemaId ? { ...item, status: newStatus } : item
        )
      );
      messageApi.success(
        `Đã ${newStatus === "active" ? "kích hoạt" : "vô hiệu hóa"} rạp thành công`
      );
    } catch (err) {
      messageApi.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`status_${cinemaId}`]: false }));
    }
  };

  const handleDelete = async (cinemaId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`delete_${cinemaId}`]: true }));
      await deleteCinema(cinemaId);
      setCinemas((prev) => prev.filter((item) => item._id !== cinemaId));
      messageApi.success("Xóa rạp chiếu thành công");
    } catch (err) {
      messageApi.error(
        err.response?.data?.message || "Không thể xóa rạp chiếu"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete_${cinemaId}`]: false }));
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getParentCinemas = () => {
    let parentCinemas = cinemas.filter((cinema) => !cinema.parentId);
    if (selectedCities.length > 0) {
      parentCinemas = parentCinemas.filter((cinema) => {
        if (Array.isArray(cinema.cityIds)) {
          return cinema.cityIds.some((cityId) => {
            const cityIdValue =
              typeof cityId === "object" ? cityId._id : cityId;
            return selectedCities.includes(cityIdValue);
          });
        }
        return false;
      });
    }
    return parentCinemas.map((cinema) => ({
      label: cinema.name,
      value: cinema._id,
    }));
  };

  const renderStatusTag = (status, record) => {
    const statusConfig = {
      active: {
        color: "green",
        text: "Hoạt động",
        icon: <CheckCircleOutlined />,
      },
      inactive: {
        color: "red",
        text: "Ngưng hoạt động",
        icon: <CloseCircleOutlined />,
      },
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

  const renderCities = (cityIds) => {
    if (!Array.isArray(cityIds) || cityIds.length === 0) return "Chưa cập nhật";
    return (
      <Space wrap>
        {cityIds.map((city, idx) => (
          <Tag key={idx} color="blue" icon={<EnvironmentOutlined />}>
            {typeof city === "object" ? city.name : city}
          </Tag>
        ))}
      </Space>
    );
  };

  const renderParentCinema = (parentId) => {
    if (!parentId) return "Rạp gốc";
    return typeof parentId === "object" ? parentId.name : "Rạp cha";
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
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 12, color: "#666" }}>
            ID: {record._id.slice(-8)}
          </div>
        </div>
      ),
    },
    {
      title: "Thuộc cụm rạp",
      dataIndex: "parentId",
      key: "parentId",
      width: 180,
      render: renderParentCinema,
    },
    {
      title: "Thành phố",
      dataIndex: "cityIds",
      key: "cityIds",
      width: 150,
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
      title: "Hành động",
      key: "actions",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/admin/cinemas/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="default"
              icon={<EditOutlined />}
              size="small"
              onClick={() => navigate(`/admin/cinemas/edit/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xác nhận xóa"
              description={`Bạn có chắc muốn xóa rạp "${record.name}"?`}
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
  if (loading) return <Loading tip="Đang tải danh sách rạp chiếu..." />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchCinemas} />;

  // Tính dữ liệu trang hiện tại
  const pagedData = filteredCinemas.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      {contextHolder}
      <div style={{ padding: "20px" }}>
        {/* Header with filters */}
        <Card style={{ marginBottom: 20 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col>
              <Link to="/admin/cinemas/create">
                <Button
                  color="primary"
                  variant="outlined"
                  icon={<PlusOutlined />}
                  size="large"
                >
                  Tạo rạp chiếu mới
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
                      setSelectedParents([]);
                    }}
                    options={cities.map((city) => ({
                      label: city.name,
                      value: city._id,
                    }))}
                  />
                </Col>
                <Col>
                  <Select
                    mode="multiple"
                    placeholder="Lọc theo rạp cha"
                    style={{ width: 250 }}
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    optionFilterProp="label"
                    value={selectedParents}
                    onChange={setSelectedParents}
                    disabled={selectedCities.length === 0}
                    options={getParentCinemas()}
                    notFoundContent={
                      selectedCities.length === 0
                        ? "Vui lòng chọn thành phố trước"
                        : "Không có rạp cha nào"
                    }
                  />
                </Col>
                <Col>
                  <Button
                    type={showParentOnly ? "primary" : "default"}
                    icon={<HomeOutlined />}
                    onClick={() => setShowParentOnly(!showParentOnly)}
                  >
                    {showParentOnly ? "Hiển thị rạp con" : "Chỉ rạp cha"}
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
            scroll={{ x: 1200 }}
            size="middle"
            style={{ background: "#fff", borderRadius: 8 }}
            locale={{
              emptyText:
                showParentOnly
                  ? "Không có rạp cha nào phù hợp với bộ lọc"
                  : selectedCities.length > 0 ||
                    selectedParents.length > 0 ||
                    searchText
                  ? "Không tìm thấy rạp chiếu phù hợp với bộ lọc"
                  : "Chưa có rạp chiếu nào",
            }}
          />

          {/* Dòng cuối: Thùng rác (trái) | Pagination (phải) */}
          <div className="cinema-list__pagination-row">
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => navigate("/admin/cinemas/trash")}
            >
              Thùng rác
            </Button>

            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredCinemas.length}
              showSizeChanger
              
              showQuickJumper
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} của ${total} rạp chiếu`
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

export default CinemaListPage;