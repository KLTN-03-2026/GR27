import React from 'react';
import { Card, Table } from 'antd';

// Chiều cao khớp FormatChart: chart 280px + padding → Card body scroll ~280px
const TABLE_MAX_HEIGHT = 280;

export const CinemaRevenueTable = ({ data, loading }) => {
  const columns = [
    {
      title: 'Rạp chiếu',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.address}</div>
        </div>
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
      title="Doanh thu theo rạp"
      loading={loading}
      styles={{ body: { padding: 0 } }}
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record) => record.cinemaId || record._id}
        pagination={false}
        size="middle"
        locale={{ emptyText: 'Không có dữ liệu' }}
        scroll={{ y: TABLE_MAX_HEIGHT }}
      />
    </Card>
  );
};