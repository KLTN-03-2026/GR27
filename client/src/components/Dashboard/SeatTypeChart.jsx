import React from 'react';
import { Card } from 'antd';
import { Pie } from '@ant-design/plots';

export const SeatTypeChart = ({ data, loading }) => {
  if (!data || data.length === 0) {
    return (
      <Card title="Phân bố loại ghế" loading={loading}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          Không có dữ liệu
        </div>
      </Card>
    );
  }

  const SEAT_LABELS = {
    standard: 'Ghế thường',
    vip: 'Ghế VIP',
    couple: 'Ghế đôi',
  };

  const chartData = data.map(item => ({
    type: SEAT_LABELS[item.type] || item.type,
    value: item.count || 0,
  }));

  const config = {
    data: chartData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      text: 'type',
      position: 'outside',
    },
    legend: { 
      color: { 
        position: 'bottom' 
      } 
    },
  };

  return (
    <Card title="Phân bố loại ghế" loading={loading}>
      <Pie {...config} height={280} />
    </Card>
  );
};