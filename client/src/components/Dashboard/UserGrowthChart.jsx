import React from 'react';
import { Card } from 'antd';
import { Line } from '@ant-design/plots';

export const UserGrowthChart = ({ data, loading }) => {
  if (!data || data.length === 0) {
    return (
      <Card title="Tăng trưởng người dùng" loading={loading}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          Không có dữ liệu
        </div>
      </Card>
    );
  }

  // Format date based on period
  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    
    if (dateObj.day) {
      // Daily format: DD/MM
      return `${dateObj.day}/${dateObj.month}`;
    } else if (dateObj.week) {
      // Weekly format: Tuần W/YYYY (vì API không trả month khi filter theo week)
      return `T${dateObj.week}/${dateObj.year}`;
    } else if (dateObj.month) {
      // Monthly format: Tháng M/YYYY
      return `T${dateObj.month}/${dateObj.year}`;
    }
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
      <Line {...config} height={280} />
    </Card>
  );
};