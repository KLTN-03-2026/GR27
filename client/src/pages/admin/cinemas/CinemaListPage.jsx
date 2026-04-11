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

  // Search states
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  // Fetch data
  const fetchCinemas = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cinemaResult, cityResult] = await Promise.all([
        getAllCinema(),
        getAllCity(),
      ]);

      console.log("Cinema result:", cinemaResult);
      console.log("City result:", cityResult);

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

  // Filter cinemas based on city, parent, and show parent only
  useEffect(() => {
    let filtered = [...cinemas];

    // Show parent only filter
    if (showParentOnly) {
      filtered = filtered.filter((cinema) => !cinema.parentId);
    } else {
      // Show only child cinemas (has parentId)
      filtered = filtered.filter((cinema) => cinema.parentId);
    }

    // Filter by cities (multi-select)
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

    // Filter by parent cinemas (multi-select)
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
  }, [cinemas, selectedCities, selectedParents, showParentOnly]);

  // Handle status toggle
  const handleStatusToggle = async (cinema) => {
    const cinemaId = cinema._id;
    const newStatus = cinema.status === "active" ? "inactive" : "active";

    try {
      setActionLoading((prev) => ({ ...prev, [`status_${cinemaId}`]: true }));

      await updateCinemaStatus(cinemaId, newStatus);

      // Update local state
      setCinemas((prev) =>
        prev.map((item) =>
          item._id === cinemaId ? { ...item, status: newStatus } : item
        )
      );

      messageApi.success(
        `Đã ${
          newStatus === "active" ? "kích hoạt" : "vô hiệu hóa"
        } rạp thành công`
      );
    } catch (err) {
      console.error("Error updating status:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`status_${cinemaId}`]: false }));
    }
  };

  // Handle delete cinema
  const handleDelete = async (cinemaId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`delete_${cinemaId}`]: true }));

      await deleteCinema(cinemaId);

      // Remove from local state
      setCinemas((prev) => prev.filter((item) => item._id !== cinemaId));

      messageApi.success("Xóa rạp chiếu thành công");
    } catch (err) {
      console.error("Error deleting cinema:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể xóa rạp chiếu"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete_${cinemaId}`]: false }));
    }
  };

  // Get parent cinemas for filter dropdown
  const getParentCinemas = () => {
    let parentCinemas = cinemas.filter((cinema) => !cinema.parentId);

    // If cities are selected, filter parent cinemas by those cities
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

  // Render status tag
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
        {actionLoading[`status_${record._id}`]
          ? "Đang cập nhật..."
          : config.text}
      </Tag>
    );
  };

  // Render cities
  const renderCities = (cityIds) => {
    if (!Array.isArray(cityIds) || cityIds.length === 0) return "Chưa cập nhật";

    return (
      <Space wrap>
        {cityIds.map((city, index) => (
          <Tag key={index} color="blue" icon={<EnvironmentOutlined />}>
            {typeof city === "object" ? city.name : city}
          </Tag>
        ))}
      </Space>
    );
  };

  // Render parent cinema
  const renderParentCinema = (parentId) => {
    if (!parentId) {
      return "Rạp gốc";
    }

    return typeof parentId === "object" ? parentId.name : "Rạp cha";
  };

  // Table columns
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
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{name}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
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
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center",
      filters: [
        {
          text: "Hoạt động",
          value: "active",
        },
        {
          text: "Ngưng hoạt động",
          value: "inactive",
        }
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

  if (loading) return <Loading tip="Đang tải danh sách rạp chiếu..." />;

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchCinemas} />;
  }

  return (
    <>
      {contextHolder}
      <div style={{ padding: "20px" }}>
        {/* Header with filters */}
        <Card style={{ marginBottom: "20px" }}>
          <Row gutter={[16, 16]} align="middle">
            <Col>
              <Link to="/admin/cinemas/create">
                <Button color="primary" variant="outlined" icon={<PlusOutlined />} size="large">
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
                      // Reset parent filter when cities change
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
            dataSource={filteredCinemas}
            rowKey="_id"
            pagination={{
              total: filteredCinemas.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} rạp chiếu`,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
            scroll={{ x: 1200 }}
            size="middle"
            style={{ background: "#fff", borderRadius: "8px" }}
            locale={{
              emptyText: showParentOnly
                ? "Không có rạp cha nào phù hợp với bộ lọc"
                : selectedCities.length > 0 ||
                  selectedParents.length > 0 ||
                  searchText
                ? "Không tìm thấy rạp chiếu phù hợp với bộ lọc"
                : "Chưa có rạp chiếu nào",
            }}
          />
        </Card>
      </div>
    </>
  );
};

export default CinemaListPage;
