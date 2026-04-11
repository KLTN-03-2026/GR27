import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  VideoCameraOutlined,
  ShopOutlined,
} from '@ant-design/icons';

export const OverviewCards = ({ data, loading }) => {
  if (!data) return null;

  const cards = [
    {
      title: 'Tổng doanh thu',
      value: data.revenue?.total || 0,
      prefix: <DollarOutlined />,
      suffix: '₫',
      valueStyle: { color: '#3f8600' },
    },
    {
      title: 'Đơn hàng',
      value: data.orders?.total || 0,
      prefix: <ShoppingCartOutlined />,
      valueStyle: { color: '#1890ff' },
    },
    {
      title: 'Vé đã bán',
      value: data.tickets?.sold || 0,
      prefix: <VideoCameraOutlined />,
      valueStyle: { color: '#cf1322' },
    },
    {
      title: 'Người dùng',
      value: data.users?.total || 0,
      prefix: <UserOutlined />,
      valueStyle: { color: '#722ed1' },
    },
    {
      title: 'Phim hoạt động',
      value: data.films?.active || 0,
      prefix: <VideoCameraOutlined />,
      valueStyle: { color: '#13c2c2' },
    },
    {
      title: 'Rạp hoạt động',
      value: data.cinemas?.active || 0,
      prefix: <ShopOutlined />,
      valueStyle: { color: '#52c41a' },
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card, index) => (
        <Col xs={24} sm={12} lg={8} xl={4} key={index}>
          <Card loading={loading} hoverable>
            <Statistic
              title={card.title}
              value={card.value}
              precision={0}
              valueStyle={card.valueStyle}
              prefix={card.prefix}
              suffix={card.suffix}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};
