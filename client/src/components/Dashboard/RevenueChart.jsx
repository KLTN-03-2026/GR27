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
    seriesField: 'type',
    isStack: true,
    color: ['#1890ff', '#52c41a'],
    legend: { 
      position: 'top' 
    },
    axis: {
      y: {
        labelFormatter: (v) => {
          const val = parseFloat(v);
          return `${(val / 1000000).toFixed(1)}M`;
        },
      },
    },
    tooltip: {
      items: [
        {
          channel: 'y',
          valueFormatter: (v) => {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(v);
          },
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