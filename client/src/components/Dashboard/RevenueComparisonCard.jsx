import React from 'react';
import { Card } from 'antd';

export const RevenueComparisonCard = ({ revenueData, loading }) => {
  if (!revenueData || revenueData.length === 0) {
    return (
      <Card title="So sánh doanh thu" loading={loading}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          Không có dữ liệu
        </div>
      </Card>
    );
  }

  const totalSeatRevenue = revenueData.reduce(
    (sum, item) => sum + (item.seatRevenue || 0),
    0
  );
  const totalComboRevenue = revenueData.reduce(
    (sum, item) => sum + (item.comboRevenue || 0),
    0
  );
  const totalRevenue = totalSeatRevenue + totalComboRevenue;

  const seatPercent =
    totalRevenue > 0 ? ((totalSeatRevenue / totalRevenue) * 100).toFixed(0) : 0;
  const comboPercent =
    totalRevenue > 0
      ? ((totalComboRevenue / totalRevenue) * 100).toFixed(0)
      : 0;

  return (
    <Card title="So sánh doanh thu" loading={loading}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>Doanh thu vé</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              flex: 1,
              height: 24,
              background: '#e6f7ff',
              borderRadius: 4,
              overflow: 'hidden',
              marginRight: 12,
            }}
          >
            <div
              style={{
                width: `${seatPercent}%`,
                height: '100%',
                background: '#1890ff',
              }}
            />
          </div>
          <strong>{seatPercent}%</strong>
        </div>
      </div>

      <div>
        <div style={{ marginBottom: 8 }}>Doanh thu combo</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              flex: 1,
              height: 24,
              background: '#f6ffed',
              borderRadius: 4,
              overflow: 'hidden',
              marginRight: 12,
            }}
          >
            <div
              style={{
                width: `${comboPercent}%`,
                height: '100%',
                background: '#52c41a',
              }}
            />
          </div>
          <strong>{comboPercent}%</strong>
        </div>
      </div>
    </Card>
  );
};