import React from 'react';
import { Card, Table, Space, Avatar, Tag } from 'antd';

export const TopFilmsTable = ({ data, loading, type }) => {
  // Title based on type
  const getTitle = () => {
    switch(type) {
      case 'rating':
        return 'Top phim đánh giá cao';
      case 'bookings':
        return 'Top phim được đặt nhiều';
      case 'revenue':
      default:
        return 'Top phim doanh thu cao';
    }
  };

  const columns =
    type === 'rating'
      ? [
          {
            title: 'Phim',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
              <Space>
                <Avatar src={record.thumbnail} shape="square" size={50} />
                <span style={{ fontWeight: 500 }}>{text}</span>
              </Space>
            ),
          },
          {
            title: 'Đánh giá TB',
            dataIndex: 'averageRating',
            key: 'averageRating',
            align: 'center',
            render: (value) => (
              <Tag color="gold" style={{ fontSize: 14 }}>
                ⭐ {value?.toFixed(1) || 0}
              </Tag>
            ),
            sorter: (a, b) => (a.averageRating || 0) - (b.averageRating || 0),
          },
          {
            title: 'Số bình luận',
            dataIndex: 'totalComments',
            key: 'totalComments',
            align: 'center',
            sorter: (a, b) => (a.totalComments || 0) - (b.totalComments || 0),
          },
        ]
      : type === 'bookings'
      ? [
          {
            title: 'Phim',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
              <Space>
                <Avatar src={record.thumbnail} shape="square" size={50} />
                <span style={{ fontWeight: 500 }}>{text}</span>
              </Space>
            ),
          },
          {
            title: 'Số đơn hàng',
            dataIndex: 'bookings',
            key: 'bookings',
            align: 'center',
            render: (value) => (
              <Tag color="blue" style={{ fontSize: 14 }}>
                {value || 0}
              </Tag>
            ),
            sorter: (a, b) => (a.bookings || 0) - (b.bookings || 0),
          },
          {
            title: 'Vé bán',
            dataIndex: 'tickets',
            key: 'tickets',
            align: 'center',
            sorter: (a, b) => (a.tickets || 0) - (b.tickets || 0),
          },
          {
            title: 'Doanh thu',
            dataIndex: 'revenue',
            key: 'revenue',
            align: 'right',
            render: (value) => (
              <span style={{ color: '#52c41a', fontWeight: 500 }}>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(value || 0)}
              </span>
            ),
            sorter: (a, b) => (a.revenue || 0) - (b.revenue || 0),
          },
        ]
      : [
          {
            title: 'Phim',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
              <Space>
                <Avatar src={record.thumbnail} shape="square" size={50} />
                <span style={{ fontWeight: 500 }}>{text}</span>
              </Space>
            ),
          },
          {
            title: 'Doanh thu',
            dataIndex: 'revenue',
            key: 'revenue',
            align: 'right',
            render: (value) => (
              <span style={{ color: '#52c41a', fontWeight: 500 }}>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(value || 0)}
              </span>
            ),
            sorter: (a, b) => (a.revenue || 0) - (b.revenue || 0),
          },
          {
            title: 'Đơn hàng',
            dataIndex: 'bookings',
            key: 'bookings',
            align: 'center',
            sorter: (a, b) => (a.bookings || 0) - (b.bookings || 0),
          },
          {
            title: 'Vé bán',
            dataIndex: 'tickets',
            key: 'tickets',
            align: 'center',
            sorter: (a, b) => (a.tickets || 0) - (b.tickets || 0),
          },
        ];

  return (
    <Card
      title={getTitle()}
      loading={loading}
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record) => record.filmId || record._id}
        pagination={false}
        size="middle"
        locale={{ emptyText: 'Không có dữ liệu' }}
      />
    </Card>
  );
};