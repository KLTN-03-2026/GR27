import React from 'react';
import { Card, Space } from 'antd';

export const QuickStatsCard = ({ overview, loading }) => {
  if (!overview) return null;

  const cancelRate = overview.orders?.total
    ? ((overview.orders.cancelled / overview.orders.total) * 100).toFixed(1)
    : 0;

  const successRate = overview.orders?.total
    ? ((overview.orders.confirmed / overview.orders.total) * 100).toFixed(1)
    : 0;

  return (
    <Card title="Thống kê nhanh" loading={loading}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Phim đang chiếu:</span>
          <strong style={{ color: '#1890ff' }}>
            {overview.films?.active || 0}
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Rạp hoạt động:</span>
          <strong style={{ color: '#52c41a' }}>
            {overview.cinemas?.active || 0}
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tỷ lệ hủy đơn:</span>
          <strong style={{ color: '#f5222d' }}>{cancelRate}%</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tỷ lệ thành công:</span>
          <strong style={{ color: '#52c41a' }}>{successRate}%</strong>
        </div>
      </Space>
    </Card>
  );
};
