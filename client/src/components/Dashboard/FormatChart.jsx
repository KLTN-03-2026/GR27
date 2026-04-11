import React from 'react';
import { Card } from 'antd';
import { Column } from '@ant-design/plots';

export const FormatChart = ({ data, loading }) => {
  if (!data || data.length === 0) {
    return (
      <Card title="Doanh thu theo định dạng" loading={loading}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          Không có dữ liệu
        </div>
      </Card>
    );
  }

  const config = {
    data: data,
    xField: 'format',
    yField: 'revenue',
    seriesField: 'format',
    color: ['#5B8FF9', '#5AD8A6', '#F6BD16', '#E86452'],
    legend: false,
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
          name: 'Doanh thu',
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
    <Card title="Doanh thu theo định dạng" loading={loading}>
      <Column {...config} height={280} />
    </Card>
  );
};
