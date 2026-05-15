import React from 'react';
import { Card } from 'antd';
import { Line } from '@ant-design/plots';

// Chiều cao bằng SeatTypeChart (280px chart → Card tổng ~352px)
const CHART_HEIGHT = 280;

export const UserGrowthChart = ({ data, loading }) => {
  if (!data || data.length === 0) {
    return (
      <Card title="Tăng trưởng người dùng" loading={loading} style={{ height: CHART_HEIGHT + 72 }}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          Không có dữ liệu
        </div>
      </Card>
    );
  }

  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    if (dateObj.day)   return `${dateObj.day}/${dateObj.month}`;
    if (dateObj.week)  return `T${dateObj.week}/${dateObj.year}`;
    if (dateObj.month) return `T${dateObj.month}/${dateObj.year}`;
    return 'N/A';
  };

  const chartData = data.map(item => ({
    date: formatDate(item.date),
    value: item.newUsers || 0,
  }));

  const config = {
    data: chartData,
    xField: 'date',
    yField: 'value',
    point: {
      size: 5,
      shape: 'circle',
    },
    style: {
      stroke: '#722ed1',
      lineWidth: 2,
    },
  };

  return (
    <Card title="Tăng trưởng người dùng" loading={loading}>
      <Line {...config} height={CHART_HEIGHT} />
    </Card>
  );
};