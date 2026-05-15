import React from 'react';
import { Card } from 'antd';
import { Column } from '@ant-design/plots';

export const RevenueChart = ({ data, loading }) => {
  if (!data || data.length === 0) {
    return (
      <Card title="Biểu đồ doanh thu" loading={loading}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          Không có dữ liệu
        </div>
      </Card>
    );
  }

  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    if (dateObj.day) return `${dateObj.day}/${dateObj.month}`;
    if (dateObj.week) return `T${dateObj.week}/${dateObj.year}`;
    if (dateObj.month) return `T${dateObj.month}/${dateObj.year}`;
    return 'N/A';
  };

  const chartData = data.flatMap(item => [
    {
      date: formatDate(item.date),
      value: item.seatRevenue || 0,
      type: 'Doanh thu vé',
    },
    {
      date: formatDate(item.date),
      value: item.comboRevenue || 0,
      type: 'Doanh thu combo',
    },
  ]);

  const config = {
    data: chartData,
    xField: 'date',
    yField: 'value',
    colorField: 'type',
    // Dùng group thay vì stack để giữ màu riêng biệt rõ ràng
    group: true,
    // Màu: vé = xanh dương, combo = xanh lá (khớp với RevenueComparisonCard)
    scale: {
      color: {
        range: ['#1890ff', '#52c41a'],
      },
    },
    legend: {
      position: 'top',
    },
    axis: {
      y: {
        labelFormatter: (v) => {
          const val = parseFloat(v);
          return `${(val / 1_000_000).toFixed(1)}M`;
        },
      },
    },
    tooltip: {
      items: [
        {
          channel: 'y',
          valueFormatter: (v) =>
            new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(v),
        },
      ],
    },
  };

  return (
    <Card title="Biểu đồ doanh thu" loading={loading}>
      <Column {...config} height={350} />
    </Card>
  );
};