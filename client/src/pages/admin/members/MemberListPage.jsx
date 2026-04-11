import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  message,
  Tooltip,
  Row,
  Col,
  Select,
  Card,
  Avatar,
  Input,
} from "antd";
import {
  EyeOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
} from "../../../services/userServices";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";

const MemberListPage = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { user: currentUser } = useSelector((state) => state.auth);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Pagination states
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Filter states
  const [searchInput, setSearchInput] = useState(""); // Input tạm thời
  const [searchKeyword, setSearchKeyword] = useState(""); // Keyword thực sự để search
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  // Fetch users with filters
  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: page.toString(),
          limit: pagination.pageSize.toString(),
        };

        if (searchKeyword) params.keyword = searchKeyword;
        if (selectedRole) params.role = selectedRole;
        if (selectedStatus) params.status = selectedStatus;

        const result = await getAllUsers(params);

        setUsers(result.data || []);
        setPagination({
          current: result.pagination.page,
          pageSize: result.pagination.limit,
          total: result.pagination.total,
        });
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(
          err.response?.data?.message || "Không thể tải danh sách thành viên"
        );
      } finally {
        setLoading(false);
      }
    },
    [searchKeyword, selectedRole, selectedStatus, pagination.pageSize]
  );

  // Initial fetch
  useEffect(() => {
    fetchUsers(1);
  }, [searchKeyword, selectedRole, selectedStatus, fetchUsers]);

  // Handle search input change
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Nếu input rỗng (bấm X hoặc xóa hết), reset search ngay
    if (!value || value.trim() === "") {
      setSearchKeyword("");
    }
  };

  // Handle search button click
  const handleSearch = () => {
    setSearchKeyword(searchInput.trim());
  };

  // Handle Enter key in search input
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle role toggle
  const handleRoleToggle = async (user) => {
    const userId = user._id;
    const newRole = user.role === "user" ? "admin" : "user";

    // Không cho phép admin tự thay đổi role của chính mình
    if (userId === currentUser._id) {
      messageApi.warning("Bạn không thể thay đổi vai trò của chính mình!");
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [`role_${userId}`]: true }));

      await updateUserRole(userId, newRole);

      // Update local state
      setUsers((prev) =>
        prev.map((item) =>
          item._id === userId ? { ...item, role: newRole } : item
        )
      );

      messageApi.success(
        `Đã cập nhật vai trò thành ${newRole === "admin" ? "Quản trị viên" : "Thành viên"}`
      );
    } catch (err) {
      console.error("Error updating role:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể cập nhật vai trò"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`role_${userId}`]: false }));
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (user) => {
    const userId = user._id;
    const newStatus = user.status === "active" ? "blocked" : "active";

    // Không cho phép admin tự thay đổi status của chính mình
    if (userId === currentUser._id) {
      messageApi.warning("Bạn không thể thay đổi trạng thái của chính mình!");
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [`status_${userId}`]: true }));

      await updateUserStatus(userId, newStatus);

      // Update local state
      setUsers((prev) =>
        prev.map((item) =>
          item._id === userId ? { ...item, status: newStatus } : item
        )
      );

      messageApi.success(
        `Đã ${newStatus === "active" ? "kích hoạt" : "khóa"} tài khoản thành công`
      );
    } catch (err) {
      console.error("Error updating status:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`status_${userId}`]: false }));
    }
  };

  // Handle table change (pagination)
  const handleTableChange = (newPagination) => {
    fetchUsers(newPagination.current);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput("");
    setSearchKeyword("");
    setSelectedRole(null);
    setSelectedStatus(null);
  };

  // Render role tag
  const renderRoleTag = (role, record) => {
    const isCurrentUser = record._id === currentUser._id;
    const roleConfig = {
      admin: {
        color: "gold",
        text: "Quản trị viên",
        icon: <CrownOutlined />,
      },
      user: {
        color: "blue",
        text: "Thành viên",
        icon: <UserOutlined />,
      },
    };
    const config = roleConfig[role] || roleConfig.user;

    return (
      <Tooltip title={isCurrentUser ? "Không thể thay đổi vai trò của chính mình" : "Click để thay đổi vai trò"}>
        <Tag
          color={config.color}
          icon={config.icon}
          style={{ 
            cursor: isCurrentUser ? "not-allowed" : "pointer",
            opacity: isCurrentUser ? 0.6 : 1
          }}
          onClick={() => !isCurrentUser && handleRoleToggle(record)}
        >
          {actionLoading[`role_${record._id}`]
            ? "Đang cập nhật..."
            : config.text}
        </Tag>
      </Tooltip>
    );
  };

  // Render status tag
  const renderStatusTag = (status, record) => {
    const isCurrentUser = record._id === currentUser._id;
    const statusConfig = {
      active: {
        color: "green",
        text: "Hoạt động",
        icon: <CheckCircleOutlined />,
      },
      blocked: {
        color: "red",
        text: "Đã khóa",
        icon: <StopOutlined />,
      },
      pending: {
        color: "orange",
        text: "Chờ xác thực",
        icon: <ClockCircleOutlined />,
      },
    };
    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Tooltip title={isCurrentUser ? "Không thể thay đổi trạng thái của chính mình" : "Click để thay đổi trạng thái"}>
        <Tag
          color={config.color}
          icon={config.icon}
          style={{ 
            cursor: isCurrentUser ? "not-allowed" : "pointer",
            opacity: isCurrentUser ? 0.6 : 1
          }}
          onClick={() => !isCurrentUser && handleStatusToggle(record)}
        >
          {actionLoading[`status_${record._id}`]
            ? "Đang cập nhật..."
            : config.text}
        </Tag>
      </Tooltip>
    );
  };

  // Table columns
  const columns = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      width: 80,
      align: "center",
      render: (avatar, record) => (
        <Avatar
          src={avatar}
          icon={<UserOutlined />}
          size={48}
          style={{ border: record._id === currentUser._id ? "2px solid gold" : "none" }}
        />
      ),
    },
    {
      title: "Tên đăng nhập",
      dataIndex: "username",
      key: "username",
      width: 180,
      render: (username, record) => (
        <div>
          <div style={{ 
            fontWeight: "bold", 
            marginBottom: "4px",
            color: record._id === currentUser._id ? "#faad14" : "inherit"
          }}>
            {username} {record._id === currentUser._id && <Tag color="gold">Bạn</Tag>}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.fullname || "Chưa cập nhật"}
          </div>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 220,
      render: (email) => (
        <div style={{ fontSize: "13px" }}>{email}</div>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      align: "center",
      render: (phone) => phone || <span style={{ color: "#999" }}>Chưa có</span>,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 160,
      align: "center",
      filters: [
        {
          text: "Quản trị viên",
          value: "admin",
        },
        {
          text: "Thành viên",
          value: "user",
        },
      ],
      onFilter: (value, record) => record.role === value,
      render: renderRoleTag,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      align: "center",
      filters: [
        {
          text: "Hoạt động",
          value: "active",
        },
        {
          text: "Đã khóa",
          value: "blocked",
        },
        {
          text: "Chờ xác thực",
          value: "pending",
        },
      ],
      onFilter: (value, record) => record.status === value,
      render: renderStatusTag,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      align: "center",
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (date) => (
        <div style={{ fontSize: "12px" }}>
          {dayjs(date).format("DD/MM/YYYY")}
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
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/admin/members/${record._id}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading && pagination.current === 1) {
    return <Loading tip="Đang tải danh sách thành viên..." />;
  }

  if (error && users.length === 0) {
    return <ErrorDisplay message={error} onRetry={() => fetchUsers(1)} />;
  }

  return (
    <>
      {contextHolder}
      <div style={{ padding: "20px" }}>
        {/* Filters */}
        <Card title="Bộ lọc" style={{ marginBottom: "20px" }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={12} md={10} lg={8}>
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  placeholder="Tìm kiếm theo tên, email..."
                  prefix={<SearchOutlined />}
                  allowClear
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  onKeyPress={handleSearchKeyPress}
                />
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  Tìm
                </Button>
              </Space.Compact>
            </Col>

            <Col xs={24} sm={12} md={7} lg={5}>
              <Select
                placeholder="Lọc theo vai trò"
                style={{ width: "100%" }}
                allowClear
                value={selectedRole}
                onChange={setSelectedRole}
                options={[
                  { value: "admin", label: "Quản trị viên" },
                  { value: "user", label: "Thành viên" },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={7} lg={5}>
              <Select
                placeholder="Lọc theo trạng thái"
                style={{ width: "100%" }}
                allowClear
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: "active", label: "Hoạt động" },
                  { value: "blocked", label: "Đã khóa" },
                  { value: "pending", label: "Chờ xác thực" },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={6} lg={6}>
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

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="_id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} thành viên`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            size="middle"
            locale={{
              emptyText: "Không tìm thấy thành viên nào phù hợp với bộ lọc",
            }}
          />
        </Card>
      </div>
    </>
  );
};

export default MemberListPage;