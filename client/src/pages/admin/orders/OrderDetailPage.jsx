import React, { useState, useEffect } from "react";
import {
  Card,
  Descriptions,
  Tag,
  Table,
  Button,
  Space,
  Row,
  Col,
  Image,
  Typography,
  Alert,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  QrcodeOutlined,
  ShopOutlined,
  VideoCameraOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { getOrderDetailAdmin } from "../../../services/orderServices";
import Loading from "../../../components/Loading";
import ErrorDisplay from "../../../components/ErrorDisplay";

const { Title, Text } = Typography;

const OrderDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch order detail
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getOrderDetailAdmin(id);

        if (result.code === 200) {
          setOrder(result.data);
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        console.error("Error fetching order detail:", err);
        setError(err.message || "Không thể tải chi tiết đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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

  const processSeatsForDisplay = (seats) => {
    if (!seats || seats.length === 0) return [];

    const processedSeats = [];
    const usedIndices = new Set();

    seats.forEach((seat, index) => {
      if (usedIndices.has(index)) return;

      if (seat.type === "couple") {
        // Tìm ghế couple kế tiếp (nếu có)
        const nextSeat = seats.find(
          (s, i) =>
            i > index &&
            s.type === "couple" &&
            !usedIndices.has(i) &&
            s.unitPrice === seat.unitPrice
        );

        if (nextSeat) {
          // Ghép 2 ghế couple thành 1
          const nextIndex = seats.indexOf(nextSeat);
          usedIndices.add(nextIndex);

          processedSeats.push({
            seatKey: `${seat.seatKey}, ${nextSeat.seatKey}`,
            type: "couple",
            unitPrice: seat.unitPrice,
            totalPrice: seat.unitPrice, // Giá đã tính cho cả cặp
            quantity: 1,
            isCouplePair: true,
          });
        } else {
          // Ghế couple lẻ (trường hợp đặc biệt)
          processedSeats.push({
            ...seat,
            totalPrice: seat.unitPrice,
            quantity: 1,
            isCouplePair: false,
          });
        }
      } else {
        // Ghế standard hoặc vip
        processedSeats.push({
          ...seat,
          totalPrice: seat.unitPrice,
          quantity: 1,
          isCouplePair: false,
        });
      }

      usedIndices.add(index);
    });

    return processedSeats;
  };

  // Seat columns for table
  const seatColumns = [
    {
      title: "Mã ghế",
      dataIndex: "seatKey",
      key: "seatKey",
      width: 150,
      render: (seatKey, record) => (
        <Space>
          {record.isCouplePair ? (
            <Tag color="magenta" icon={<UsergroupAddOutlined />}>
              {seatKey}
            </Tag>
          ) : (
            <Tag color="blue">{seatKey}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Loại ghế",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type, record) => {
        const typeConfig = {
          standard: { color: "default", text: "Standard" },
          vip: { color: "gold", text: "VIP" },
          couple: {
            color: "magenta",
            text: record.isCouplePair ? "Couple (Cặp)" : "Couple",
          },
        };
        const config = typeConfig[type] || typeConfig.standard;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 120,
      align: "right",
      render: (price, record) => (
        <div>
          <div>{formatCurrency(price)}</div>
          {record.isCouplePair && (
            <Text type="secondary" style={{ fontSize: "11px" }}>
              (Giá cả cặp)
            </Text>
          )}
        </div>
      ),
    },
  ];

  // Combo columns for table
  const comboColumns = [
    {
      title: "Tên combo",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      width: 120,
      align: "right",
      render: (price) => formatCurrency(price),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "center",
    },
    {
      title: "Thành tiền",
      key: "total",
      width: 120,
      align: "right",
      render: (_, record) => formatCurrency(record.price * record.quantity),
    },
  ];

  if (loading) return <Loading tip="Đang tải chi tiết đơn hàng..." />;

  if (error) {
    return (
      <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
    );
  }

  if (!order) {
    return (
      <div style={{ padding: "20px" }}>
        <Alert message="Không tìm thấy đơn hàng" type="warning" showIcon />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <Card>
        {/* Button Quay lại - Dòng riêng */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/admin/orders")}
          style={{ marginBottom: "16px" }}
        >
          Quay lại danh sách
        </Button>

        <Divider style={{ margin: "16px 0" }} />

        {/* Title và Ticket Code */}
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Space direction="vertical" size="small">
              <Text type="secondary" style={{ fontSize: "13px" }}>
                Mã vé
              </Text>
              <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
                {order.ticketCode}
              </Title>
            </Space>
          </Col>

          {/* Trạng thái bên phải */}
          <Col xs={24} md={12}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {/* Trạng thái đơn hàng */}
              <div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "13px",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Trạng thái đơn hàng
                </Text>
                {renderOrderStatusTag(order.orderStatus)}
              </div>

              {/* Trạng thái thanh toán */}
              <div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "13px",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Trạng thái thanh toán
                </Text>
                {renderPaymentStatusTag(order.paymentStatus)}
              </div>
            </Space>
          </Col>
        </Row>

        {/* Thông tin thời gian */}
        <Divider style={{ margin: "16px 0" }} />
        <Row gutter={[16, 8]}>
          <Col xs={24} sm={12}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              <CalendarOutlined /> Ngày đặt:{" "}
              {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}
            </Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              <ClockCircleOutlined /> Cập nhật:{" "}
              {dayjs(order.updatedAt).format("DD/MM/YYYY HH:mm")}
            </Text>
          </Col>
        </Row>
      </Card>
      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        {/* Customer Info */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <>
                <UserOutlined /> Thông tin khách hàng
              </>
            }
            bordered
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Tên đăng nhập">
                <Text strong>{order.userId?.username || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <MailOutlined /> Email
                  </>
                }
              >
                {order.userId?.email || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <PhoneOutlined /> Số điện thoại
                  </>
                }
              >
                {order.userId?.phone || "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Film & Showtime Info */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <>
                <VideoCameraOutlined /> Thông tin suất chiếu
              </>
            }
            bordered
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Phim">
                <Text strong>{order.showtimeId?.filmId?.title || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <ShopOutlined /> Rạp chiếu
                  </>
                }
              >
                {order.showtimeId?.cinemaId?.name || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Phòng chiếu">
                {order.showtimeId?.roomId?.name || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <CalendarOutlined /> Thời gian chiếu
                  </>
                }
              >
                {order.showtimeId?.startTime ? (
                  <>
                    <div>
                      <ClockCircleOutlined />{" "}
                      {dayjs(order.showtimeId.startTime).format("HH:mm")} -{" "}
                      {dayjs(order.showtimeId.endTime).format("HH:mm")}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {dayjs(order.showtimeId.startTime).format("DD/MM/YYYY")}
                    </div>
                  </>
                ) : (
                  "N/A"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Định dạng">
                <Tag color="cyan">{order.showtimeId?.format || "N/A"}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Seats Info */}
        <Col xs={24}>
          <Card title="Danh sách ghế đã đặt" bordered>
            <Table
              columns={seatColumns}
              dataSource={processSeatsForDisplay(order.seats) || []}
              rowKey="seatKey"
              pagination={false}
              size="small"
              summary={(pageData) => {
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={2} align="right">
                        <Text strong>Tổng phụ (Ghế):</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <Text strong type="success">
                          {formatCurrency(order.seatSubtotal)}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        </Col>

        {/* Combo Foods */}
        {order.comboFoods && order.comboFoods.length > 0 && (
          <Col xs={24}>
            <Card title="Combo đồ ăn & nước" bordered>
              <Table
                columns={comboColumns}
                dataSource={order.comboFoods}
                rowKey={(record) => record.comboFoodId.toString()}
                pagination={false}
                size="small"
                summary={(pageData) => {
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell colSpan={3} align="right">
                          <Text strong>Tổng phụ (Combo):</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell align="right">
                          <Text strong type="success">
                            {formatCurrency(order.comboSubtotal)}
                          </Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </Card>
          </Col>
        )}

        {/* Payment Info */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <>
                <DollarOutlined /> Thông tin thanh toán
              </>
            }
            bordered
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Phương thức">
                <Tag color="blue">{order.paymentMethod}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mã giao dịch">
                {order.transactionId || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền ghế">
                {formatCurrency(order.seatSubtotal)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền combo">
                {formatCurrency(order.comboSubtotal)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng thanh toán">
                <Text strong style={{ fontSize: "16px", color: "#52c41a" }}>
                  {formatCurrency(order.totalAmount)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* QR Code */}
        {order.ticketQrUrl && order.paymentStatus === "paid" && (
          <Col xs={24} lg={12}>
            <Card
              title={
                <>
                  <QrcodeOutlined /> QR Code vé
                </>
              }
              bordered
            >
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Image
                  src={order.ticketQrUrl}
                  alt="QR Code"
                  width={200}
                  preview={true}
                />
                <div
                  style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}
                >
                  Mã vé: {order.ticketCode}
                </div>
              </div>
            </Card>
          </Col>
        )}

        {/* Order Timeline */}
        <Col xs={24}>
          <Card title="Thông tin đơn hàng" bordered>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Ngày tạo">
                {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm:ss")}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {dayjs(order.updatedAt).format("DD/MM/YYYY HH:mm:ss")}
              </Descriptions.Item>
              {order.redeemedAt && (
                <Descriptions.Item label="Ngày sử dụng">
                  {dayjs(order.redeemedAt).format("DD/MM/YYYY HH:mm:ss")}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OrderDetailPage;
