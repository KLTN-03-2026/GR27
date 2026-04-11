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
  Input,
  Rate,
  Popconfirm,
  Modal,
  Avatar,
  Descriptions,
  Typography,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  UserOutlined,
  StopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  deleteComment,
  unReportComment,
} from "../../../services/commentServices";
import { getAllFilms } from "../../../services/filmServices";
import { getAllUsers, updateUserStatus } from "../../../services/userServices";
import { get } from "../../../utils";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";

const { Text, Paragraph } = Typography;

const CommentListPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [comments, setComments] = useState([]);
  const [films, setFilms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);

  // Pagination states
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Filter states
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedRate, setSelectedRate] = useState(null);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReported, setSelectedReported] = useState(null);

  // Fetch reference data (films and users)
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [filmResult, userResult] = await Promise.all([
          getAllFilms(),
          getAllUsers({ limit: "1000" }),
        ]);

        setFilms(filmResult.data || []);
        setUsers(userResult.data || []);
      } catch (err) {
        console.error("Error fetching reference data:", err);
      }
    };

    fetchReferenceData();
  }, []);

  // Fetch comments with filters
  const fetchComments = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: page.toString(),
          limit: pagination.pageSize.toString(),
        };

        if (searchKeyword) params.keyword = searchKeyword;
        if (selectedRate) params.rate = selectedRate.toString();
        if (selectedFilm) params.filmId = selectedFilm;
        if (selectedUser) params.userId = selectedUser;
        if (selectedReported !== null) params.isReported = selectedReported;

        const query = new URLSearchParams(params).toString();
        const result = await get(`/comments?${query}`);

        setComments(result.data || []);
        setPagination({
          current: result.pagination.page,
          pageSize: result.pagination.limit,
          total: result.pagination.total,
        });
      } catch (err) {
        console.error("Error fetching comments:", err);
        setError(
          err.response?.data?.message || "Không thể tải danh sách bình luận"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      searchKeyword,
      selectedRate,
      selectedFilm,
      selectedUser,
      selectedReported,
      pagination.pageSize,
    ]
  );

  // Initial fetch
  useEffect(() => {
    fetchComments(1);
  }, [searchKeyword, selectedRate, selectedFilm, selectedUser, selectedReported, fetchComments]);

  // Handle search
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (!value || value.trim() === "") {
      setSearchKeyword("");
    }
  };

  const handleSearch = () => {
    setSearchKeyword(searchInput.trim());
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchInput("");
    setSearchKeyword("");
    setSelectedRate(null);
    setSelectedFilm(null);
    setSelectedUser(null);
    setSelectedReported(null);
  };

  // Handle table change (pagination)
  const handleTableChange = (newPagination) => {
    fetchComments(newPagination.current);
  };

  // Handle unreport (Admin only)
  const handleUnreport = async (comment) => {
    const commentId = comment._id;

    try {
      setActionLoading((prev) => ({ ...prev, [`unreport_${commentId}`]: true }));

      await unReportComment(commentId);

      // Update local state
      setComments((prev) =>
        prev.map((item) =>
          item._id === commentId
            ? { ...item, isReported: false }
            : item
        )
      );

      messageApi.success("Đã gỡ báo cáo bình luận thành công");
    } catch (err) {
      console.error("Error unreporting comment:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể gỡ báo cáo bình luận"
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`unreport_${commentId}`]: false,
      }));
    }
  };

  // Handle block user
  const handleBlockUser = async (comment) => {
    const userId = comment.userId._id;

    try {
      setActionLoading((prev) => ({ ...prev, [`block_${userId}`]: true }));

      await updateUserStatus(userId, "blocked");

      messageApi.success(`Đã khóa tài khoản ${comment.userId.username}`);

      // Refresh comments
      fetchComments(pagination.current);
    } catch (err) {
      console.error("Error blocking user:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể khóa tài khoản"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`block_${userId}`]: false }));
    }
  };

  // Handle delete comment
  const handleDelete = async (commentId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`delete_${commentId}`]: true }));

      await deleteComment(commentId);

      messageApi.success("Xóa bình luận thành công");

      // Refresh comments
      fetchComments(pagination.current);
    } catch (err) {
      console.error("Error deleting comment:", err);
      messageApi.error(
        err.response?.data?.message || "Không thể xóa bình luận"
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`delete_${commentId}`]: false,
      }));
    }
  };

  // Handle view detail
  const handleViewDetail = (comment) => {
    setSelectedComment(comment);
    setDetailModalVisible(true);
  };

  // Render report tag (clickable if reported)
  const renderReportTag = (isReported, record) => {
    if (isReported) {
      // Nếu bị báo cáo, admin có thể click để gỡ
      return (
        <Tooltip title="Click để gỡ báo cáo">
          <Tag
            color="red"
            icon={<WarningOutlined />}
            style={{ cursor: "pointer" }}
            onClick={() => handleUnreport(record)}
          >
            {actionLoading[`unreport_${record._id}`]
              ? "Đang gỡ..."
              : "Đã báo cáo"}
          </Tag>
        </Tooltip>
      );
    }

    // Nếu bình thường, chỉ hiển thị tag
    return (
      <Tag color="green" icon={<CheckCircleOutlined />}>
        Bình thường
      </Tag>
    );
  };

  // Table columns
  const columns = [
    {
      title: "Người dùng",
      dataIndex: "userId",
      key: "userId",
      width: 180,
      render: (user) => (
        <Space>
          <Avatar src={user?.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: "bold" }}>{user?.username || "N/A"}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {user?.email || ""}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Nội dung bình luận",
      dataIndex: "content",
      key: "content",
      width: 300,
      render: (content, record) => (
        <div>
          <Rate
            disabled
            value={record.rate}
            style={{ fontSize: "14px", marginBottom: "8px" }}
          />
          <Paragraph
            ellipsis={{ rows: 2, expandable: false }}
            style={{ margin: 0, fontSize: "13px" }}
          >
            {content}
          </Paragraph>
        </div>
      ),
    },
    {
      title: "Phim",
      dataIndex: "filmId",
      key: "filmId",
      width: 200,
      render: (film) => (
        <div>
          <Text strong>{film?.title || "N/A"}</Text>
        </div>
      ),
    },
    {
      title: "Ngày đăng",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 100,
      align: "center",
      render: (date) => (
        <div style={{ fontSize: "12px" }}>
          {dayjs(date).format("DD/MM/YYYY")}
          <br />
          {dayjs(date).format("HH:mm")}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isReported",
      key: "isReported",
      width: 120,
      align: "center",
      render: renderReportTag,
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
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>

          <Tooltip title="Khóa người dùng">
            <Popconfirm
              title="Xác nhận khóa tài khoản"
              description={`Bạn có chắc muốn khóa tài khoản "${record.userId?.username}"?`}
              onConfirm={() => handleBlockUser(record)}
              okText="Khóa"
              cancelText="Hủy"
              okType="danger"
            >
              <Button
                danger
                icon={<StopOutlined />}
                size="small"
                loading={actionLoading[`block_${record.userId?._id}`]}
              />
            </Popconfirm>
          </Tooltip>

          <Tooltip title="Xóa bình luận">
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc muốn xóa bình luận này?"
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

  if (loading && pagination.current === 1) {
    return <Loading tip="Đang tải danh sách bình luận..." />;
  }

  if (error && comments.length === 0) {
    return <ErrorDisplay message={error} onRetry={() => fetchComments(1)} />;
  }

  return (
    <>
      {contextHolder}
      <div style={{ padding: "20px" }}>
        {/* Filters */}
        <Card title="Bộ lọc" style={{ marginBottom: "20px" }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  placeholder="Tìm kiếm nội dung..."
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

            <Col xs={24} sm={12} md={8} lg={4}>
              <Select
                placeholder="Lọc theo sao"
                style={{ width: "100%" }}
                allowClear
                value={selectedRate}
                onChange={setSelectedRate}
                options={[
                  { value: 5, label: "⭐⭐⭐⭐⭐ (5 sao)" },
                  { value: 4, label: "⭐⭐⭐⭐ (4 sao)" },
                  { value: 3, label: "⭐⭐⭐ (3 sao)" },
                  { value: 2, label: "⭐⭐ (2 sao)" },
                  { value: 1, label: "⭐ (1 sao)" },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={5}>
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
                value={selectedFilm}
                onChange={setSelectedFilm}
                options={films.map((film) => ({
                  label: film.title,
                  value: film._id,
                }))}
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={5}>
              <Select
                placeholder="Lọc theo user"
                style={{ width: "100%" }}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                value={selectedUser}
                onChange={setSelectedUser}
                options={users.map((user) => ({
                  label: user.username,
                  value: user._id,
                }))}
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={4}>
              <Select
                placeholder="Trạng thái"
                style={{ width: "100%" }}
                allowClear
                value={selectedReported}
                onChange={setSelectedReported}
                options={[
                  { value: "true", label: "Đã báo cáo" },
                  { value: "false", label: "Bình thường" },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={24} lg={24}>
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
            dataSource={comments}
            rowKey="_id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} bình luận`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1400 }}
            size="middle"
            locale={{
              emptyText: "Không tìm thấy bình luận nào phù hợp với bộ lọc",
            }}
          />
        </Card>

        {/* Detail Modal */}
        <Modal
          title="Chi tiết bình luận"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              Đóng
            </Button>,
          ]}
          width={700}
        >
          {selectedComment && (
            <div>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Người dùng">
                  <Space>
                    <Avatar
                      src={selectedComment.userId?.avatar}
                      icon={<UserOutlined />}
                    />
                    <div>
                      <div style={{ fontWeight: "bold" }}>
                        {selectedComment.userId?.username || "N/A"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {selectedComment.userId?.email || ""}
                      </div>
                    </div>
                  </Space>
                </Descriptions.Item>

                <Descriptions.Item label="Phim">
                  <Text strong>{selectedComment.filmId?.title || "N/A"}</Text>
                </Descriptions.Item>

                <Descriptions.Item label="Đánh giá">
                  <Rate disabled value={selectedComment.rate} />
                  <Text style={{ marginLeft: "8px" }}>
                    ({selectedComment.rate}/5 sao)
                  </Text>
                </Descriptions.Item>

                <Descriptions.Item label="Nội dung">
                  <Paragraph style={{ whiteSpace: "pre-wrap" }}>
                    {selectedComment.content}
                  </Paragraph>
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái">
                  {renderReportTag(selectedComment.isReported, selectedComment)}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày đăng">
                  {dayjs(selectedComment.createdAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="ID">
                  <Text code>{selectedComment._id}</Text>
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default CommentListPage;