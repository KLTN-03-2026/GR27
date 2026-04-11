import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Tooltip,
  Row,
  Col,
  Select,
  Card,
  DatePicker,
  Input,
  TreeSelect,
  Typography,
} from "antd";
import {
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  DollarOutlined,
  UserOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getAllOrdersAdmin } from "../../../services/orderServices";
import { getAllFilms } from "../../../services/filmServices";
import { getAllCity } from "../../../services/cityServices";
import { getAllCinema } from "../../../services/cinemaServices";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";
import "./orders.scss";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const OrderListPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [films, setFilms] = useState([]);
  const [cities, setCities] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [selectedOrderStatus, setSelectedOrderStatus] = useState(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [selectedFilmId, setSelectedFilmId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedCinemaId, setSelectedCinemaId] = useState(null);

  // Fetch reference data (films, cities, cinemas)
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [filmResult, cityResult, cinemaResult] = await Promise.all([
          getAllFilms(),
          getAllCity(),
          getAllCinema(),
        ]);

        setFilms(filmResult.data || []);
        setCities(cityResult || []);
        setCinemas(cinemaResult || []);
      } catch (err) {
        console.error("Error fetching reference data:", err);
      }
    };

    fetchReferenceData();
  }, []);

  // Fetch orders with filters
  const fetchOrders = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        // Build params
        const params = {
          page: page.toString(),
          limit: pagination.pageSize.toString(),
        };

        if (searchText && searchText.trim()) {
          params.search = searchText.trim();
        }

        if (selectedOrderStatus && selectedOrderStatus !== "all") {
          params.orderStatus = selectedOrderStatus;
        }

        if (selectedPaymentStatus && selectedPaymentStatus !== "all") {
          params.paymentStatus = selectedPaymentStatus;
        }

        if (dateRange && dateRange[0] && dateRange[1]) {
          params.startDate = dateRange[0].format("YYYY-MM-DD");
          params.endDate = dateRange[1].format("YYYY-MM-DD");
        }

        if (selectedFilmId && selectedFilmId !== "all") {
          params.filmId = selectedFilmId;
        }

        if (selectedCinemaId && selectedCinemaId !== "all") {
          params.cinemaId = selectedCinemaId;
        }

        const result = await getAllOrdersAdmin(params);

        if (result.code === 200) {
          setOrders(result.data || []);
          setPagination({
            current: result.pagination.page,
            pageSize: result.pagination.limit,
            total: result.pagination.total,
          });
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.message || "Không thể tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    },
    [
      searchText,
      selectedOrderStatus,
      selectedPaymentStatus,
      dateRange,
      selectedFilmId,
      selectedCinemaId,
      pagination.pageSize,
    ]
  );

  // Initial fetch
  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  // Build cinema tree structure for TreeSelect
  const buildCinemaTree = (cinemasList) => {
    const parentCinemas = cinemasList.filter((cinema) => !cinema.parentId);
    const childCinemas = cinemasList.filter((cinema) => cinema.parentId);

    const treeData = parentCinemas.map((parent) => ({
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

    return treeData;
  };

  // Get cinemas filtered by selected city
  const getFilteredCinemaTree = () => {
    if (!selectedCityId) {
      return buildCinemaTree(cinemas);
    }

    const filtered = cinemas.filter((cinema) => {
      if (!cinema.cityIds) return false;

      return cinema.cityIds.some((cityId) => {
        const cityIdValue = typeof cityId === "object" ? cityId._id : cityId;
        return cityIdValue === selectedCityId;
      });
    });

    return buildCinemaTree(filtered);
  };

  // Handle city change
  const handleCityChange = (value) => {
    setSelectedCityId(value);
    setSelectedCinemaId(null);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchText("");
    setSelectedOrderStatus(null);
    setSelectedPaymentStatus(null);
    setDateRange(null);
    setSelectedFilmId(null);
    setSelectedCityId(null);
    setSelectedCinemaId(null);
  };

  // Handle table change (pagination)
  const handleTableChange = (newPagination) => {
    fetchOrders(newPagination.current);
  };

  // Render order status tag
  const renderOrderStatusTag = (status) => {
    const statusConfig = {
      pending: { color: "warning", text: "Chờ xử lý" },
      confirmed: { color: "success", text: "Đã xác nhận" },
      cancelled: { color: "error", text: "Đã hủy" },
      refunded: { color: "default", text: "Đã hoàn tiền" },
      expired: { color: "default", text: "Đã hết hạn" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Render payment status tag
  const renderPaymentStatusTag = (status) => {
    const statusConfig = {
      pending: { color: "warning", text: "Chờ thanh toán" },
      paid: { color: "success", text: "Đã thanh toán" },
      failed: { color: "error", text: "Thất bại" },
      refunded: { color: "default", text: "Đã hoàn tiền" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Render film info
  const renderFilmInfo = (showtimeId) => {
    if (!showtimeId || !showtimeId.filmId) return "N/A";
    const film = showtimeId.filmId;
    return typeof film === "object" ? film.title : film;
  };

  // Render cinema info
  const renderCinemaInfo = (showtimeId) => {
    if (!showtimeId || !showtimeId.cinemaId) return "N/A";
    const cinema = showtimeId.cinemaId;
    return typeof cinema === "object" ? cinema.name : cinema;
  };

  // Render showtime info
  const renderShowtimeInfo = (showtimeId) => {
    if (!showtimeId || !showtimeId.startTime) return "N/A";

    return (
      <div>
        <div style={{ fontWeight: "bold", color: "#1890ff" }}>
          {dayjs(showtimeId.startTime).format("HH:mm")} -{" "}
          {dayjs(showtimeId.endTime).format("HH:mm")}
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>
          {dayjs(showtimeId.startTime).format("DD/MM/YYYY")}
        </div>
      </div>
    );
  };

  // Table columns
  const columns = [
    {
      title: "Mã vé",
      dataIndex: "ticketCode",
      key: "ticketCode",
      width: 140,
      fixed: "left",
      render: (ticketCode) => (
        <Text strong style={{ color: "#1890ff" }}>
          {ticketCode}
        </Text>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "userId",
      key: "userId",
      width: 180,
      render: (userId) => {
        if (!userId) return "N/A";
        return (
          <div>
            <div style={{ fontWeight: "bold" }}>
              <UserOutlined /> {userId.username || "N/A"}
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {userId.email || ""}
            </div>
          </div>
        );
      },
    },
    {
      title: "Phim",
      key: "film",
      width: 180,
      render: (_, record) => (
        <div>
          <VideoCameraOutlined /> {renderFilmInfo(record.showtimeId)}
        </div>
      ),
    },
    {
      title: "Suất chiếu",
      key: "showtime",
      width: 160,
      align: "center",
      render: (_, record) => renderShowtimeInfo(record.showtimeId),
    },
    {
      title: "Rạp",
      key: "cinema",
      width: 150,
      render: (_, record) => renderCinemaInfo(record.showtimeId),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 120,
      align: "right",
      render: (amount) => (
        <Text strong style={{ color: "#52c41a" }}>
          <DollarOutlined /> {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: "TT Thanh toán",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 140,
      align: "center",
      render: renderPaymentStatusTag,
    },
    {
      title: "TT Đơn hàng",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 140,
      align: "center",
      render: renderOrderStatusTag,
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      align: "center",
      render: (date) => (
        <div style={{ fontSize: "12px" }}>
          <CalendarOutlined /> {dayjs(date).format("DD/MM/YYYY")}
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
        <Tooltip title="Xem chi tiết">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/admin/orders/${record._id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  if (loading && pagination.current === 1) {
    return <Loading tip="Đang tải danh sách đơn hàng..." />;
  }

  if (error && orders.length === 0) {
    return <ErrorDisplay message={error} onRetry={() => fetchOrders(1)} />;
  }

  return (
    <div className="order-list-page" style={{ padding: "20px" }}>
      {/* Filters */}
      <Card title="Bộ lọc & Tìm kiếm" style={{ marginBottom: "20px" }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Tìm theo mã vé"
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => fetchOrders(1)}
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
              options={[
                { value: "all", label: "Tất cả phim" },
                ...films.map((film) => ({
                  label: film.title,
                  value: film._id,
                })),
              ]}
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
              placeholder="Lọc theo rạp"
              style={{ width: "100%" }}
              allowClear
              treeDefaultExpandAll
              treeData={getFilteredCinemaTree()}
              value={selectedCinemaId}
              onChange={setSelectedCinemaId}
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
              placeholder="TT Đơn hàng"
              style={{ width: "100%" }}
              allowClear
              value={selectedOrderStatus}
              onChange={setSelectedOrderStatus}
              options={[
                { value: "all", label: "Tất cả" },
                { value: "pending", label: "Chờ xử lý" },
                { value: "confirmed", label: "Đã xác nhận" },
                { value: "cancelled", label: "Đã hủy" },
                { value: "refunded", label: "Đã hoàn tiền" },
                { value: "expired", label: "Đã hết hạn" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="TT Thanh toán"
              style={{ width: "100%" }}
              allowClear
              value={selectedPaymentStatus}
              onChange={setSelectedPaymentStatus}
              options={[
                { value: "all", label: "Tất cả" },
                { value: "pending", label: "Chờ thanh toán" },
                { value: "paid", label: "Đã thanh toán" },
                { value: "failed", label: "Thất bại" },
                { value: "refunded", label: "Đã hoàn tiền" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchOrders(1)}>
                Tìm kiếm
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} đơn hàng`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
          size="middle"
          locale={{
            emptyText: "Không tìm thấy đơn hàng nào phù hợp với bộ lọc",
          }}
        />
      </Card>
    </div>
  );
};

export default OrderListPage;