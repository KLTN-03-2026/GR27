import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Button,
  Descriptions,
  Divider,
  message,
  Avatar,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  getUserById,
  updateUserRole,
  updateUserStatus,
} from "../../../services/userServices";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";

const { Title, Text } = Typography;

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { user: currentUser } = useSelector((state) => state.auth);
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    role: false,
    status: false,
  });

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUserById(id);
      setUserData(result.user);
    } catch (err) {
      console.error("Error fetching user:", err);
      setError(
        err.response?.data?.message || "Không thể tải thông tin thành viên"
      );
      messageApi.error("Không thể tải thông tin thành viên");
    } finally {
      setLoading(false);
    }
  }, [id, messageApi]);

  useEffect(() => {
    if (id) {
      fetchUserData();
    } else {
      setError("Không tìm thấy ID thành viên");
      setLoading(false);
    }
  }, [fetchUserData, id]);

  const handleBack = () => {
    navigate("/admin/members");
  };

  const handleRetry = () => {
    fetchUserData();
  };

  // Handle role toggle
  const handleRoleToggle = async () => {
    if (userData._id === currentUser._id) {
      messageApi.warning("Bạn không thể thay đổi vai trò của chính mình!");
      return;
    }

    const newRole = userData.role === "user" ? "admin" : "user";

    try {
      setActionLoading((prev) => ({ ...prev, role: true }));

      await updateUserRole(userData._id, newRole);

      setUserData((prev) => ({ ...prev, role: newRole }));

      messageApi.success(
        `Đã cập nhật vai trò thành ${newRole === "admin" ? "Quản trị viên" : "Thành viên"}`
      );
    } catch (err) {
      console.error("Error updating role:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể cập nhật vai trò"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, role: false }));
    }
  };

  // Handle status toggle
  const handleStatusToggle = async () => {
    if (userData._id === currentUser._id) {
      messageApi.warning("Bạn không thể thay đổi trạng thái của chính mình!");
      return;
    }

    const newStatus = userData.status === "active" ? "blocked" : "active";

    try {
      setActionLoading((prev) => ({ ...prev, status: true }));

      await updateUserStatus(userData._id, newStatus);

      setUserData((prev) => ({ ...prev, status: newStatus }));

      messageApi.success(
        `Đã ${newStatus === "active" ? "kích hoạt" : "khóa"} tài khoản thành công`
      );
    } catch (err) {
      console.error("Error updating status:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, status: false }));
    }
  };

  // Render role tag
  const renderRoleTag = (role) => {
    const isCurrentUser = userData._id === currentUser._id;
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
      <Tag
        color={config.color}
        icon={config.icon}
        style={{ 
          cursor: isCurrentUser ? "not-allowed" : "pointer",
          fontSize: "14px",
          padding: "4px 12px",
          opacity: isCurrentUser ? 0.6 : 1
        }}
        onClick={!isCurrentUser ? handleRoleToggle : undefined}
      >
        {actionLoading.role ? "Đang cập nhật..." : config.text}
      </Tag>
    );
  };

  // Render status tag
  const renderStatusTag = (status) => {
    const isCurrentUser = userData._id === currentUser._id;
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
      <Tag
        color={config.color}
        icon={config.icon}
        style={{ 
          cursor: isCurrentUser ? "not-allowed" : "pointer",
          fontSize: "14px",
          padding: "4px 12px",
          opacity: isCurrentUser ? 0.6 : 1
        }}
        onClick={!isCurrentUser ? handleStatusToggle : undefined}
      >
        {actionLoading.status ? "Đang cập nhật..." : config.text}
      </Tag>
    );
  };

  if (loading) return <Loading tip="Đang tải thông tin thành viên..." />;

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <ErrorDisplay message={error} onRetry={handleRetry} />
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{ padding: "20px" }}>
        <ErrorDisplay message="Không tìm thấy thông tin thành viên" />
      </div>
    );
  }

  const isCurrentUser = userData._id === currentUser._id;

  return (
    <>
      {contextHolder}
      <div
        style={{
          padding: "24px",
          backgroundColor: "#f5f5f5",
          minHeight: "100vh",
        }}
      >
        {/* Header với nút điều hướng */}
        <div style={{ marginBottom: "24px" }}>
          <Space size="middle">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              size="large"
            >
              Quay lại danh sách
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          {/* Cột trái - Avatar và thông tin cơ bản */}
          <Col xs={24} md={8}>
            <Card>
              <div style={{ textAlign: "center" }}>
                <Avatar
                  src={userData.avatar}
                  icon={<UserOutlined />}
                  size={120}
                  style={{ 
                    marginBottom: "16px",
                    border: isCurrentUser ? "3px solid gold" : "none"
                  }}
                />

                <Title level={3} style={{ marginBottom: "8px" }}>
                  {userData.username}
                  {isCurrentUser && (
                    <Tag color="gold" style={{ marginLeft: "8px" }}>
                      Bạn
                    </Tag>
                  )}
                </Title>

                <Text type="secondary" style={{ fontSize: "16px" }}>
                  {userData.fullname || "Chưa cập nhật họ tên"}
                </Text>

                <Divider />

                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <div>
                    <Text strong>Vai trò:</Text>
                    <div style={{ marginTop: "8px" }}>
                      {renderRoleTag(userData.role)}
                    </div>
                    {!isCurrentUser && (
                      <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                        Click để thay đổi
                      </Text>
                    )}
                  </div>

                  <div>
                    <Text strong>Trạng thái:</Text>
                    <div style={{ marginTop: "8px" }}>
                      {renderStatusTag(userData.status)}
                    </div>
                    {!isCurrentUser && (
                      <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                        Click để thay đổi
                      </Text>
                    )}
                  </div>
                </Space>
              </div>
            </Card>

            {/* Thông tin nhanh */}
            <Card title="Thông tin nhanh" style={{ marginTop: "16px" }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item
                  label={
                    <>
                      <CalendarOutlined /> Ngày tạo
                    </>
                  }
                >
                  {dayjs(userData.createdAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <>
                      <CalendarOutlined /> Cập nhật lần cuối
                    </>
                  }
                >
                  {dayjs(userData.updatedAt).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Cột phải - Thông tin chi tiết */}
          <Col xs={24} md={16}>
            {/* Thông tin liên hệ */}
            <Card title="Thông tin liên hệ">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <div>
                      <Title level={5}>
                        <MailOutlined /> Email
                      </Title>
                      <Text copyable style={{ fontSize: "15px" }}>
                        {userData.email}
                      </Text>
                    </div>

                    <Divider />

                    <div>
                      <Title level={5}>
                        <PhoneOutlined /> Số điện thoại
                      </Title>
                      <Text style={{ fontSize: "15px" }}>
                        {userData.phone || (
                          <span style={{ color: "#999" }}>Chưa cập nhật</span>
                        )}
                      </Text>
                    </div>

                    <Divider />

                    <div>
                      <Title level={5}>
                        <HomeOutlined /> Địa chỉ
                      </Title>
                      <Text style={{ fontSize: "15px" }}>
                        {userData.address || (
                          <span style={{ color: "#999" }}>Chưa cập nhật</span>
                        )}
                      </Text>
                    </div>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Thông tin hệ thống */}
            <Card title="Thông tin hệ thống" style={{ marginTop: "16px" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="ID">
                      <Text code>{userData._id}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Tên đăng nhập">
                      <Text strong>{userData.username}</Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>

                <Col xs={24} md={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Ngày tạo">
                      {dayjs(userData.createdAt).format("DD/MM/YYYY HH:mm")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Cập nhật lần cuối">
                      {dayjs(userData.updatedAt).format("DD/MM/YYYY HH:mm")}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Ghi chú cho admin */}
            {isCurrentUser && (
              <Card 
                style={{ marginTop: "16px", borderColor: "#faad14" }}
                styles={{ body: { backgroundColor: "#fffbe6" } }}
              >
                <Space>
                  <CrownOutlined style={{ color: "#faad14", fontSize: "18px" }} />
                  <Text strong style={{ color: "#ad8b00" }}>
                    Đây là tài khoản của bạn. Bạn không thể thay đổi vai trò hoặc trạng thái của chính mình.
                  </Text>
                </Space>
              </Card>
            )}
          </Col>
        </Row>
      </div>
    </>
  );
};

export default MemberDetailPage;