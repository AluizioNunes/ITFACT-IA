import React from 'react';
import { Card, Spin } from 'antd';

interface SimpleChartProps {
  data: any[];
  title: string;
  loading: boolean;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ data, title, loading }) => {
  if (loading) {
    return (
      <Card title={title} style={{ height: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  // Criar um gráfico simples com barras
  const maxValue = Math.max(...data.map(d => d.value), 0);
  const chartHeight = 300;
  const barWidth = 40;
  const spacing = 20;

  return (
    <Card title={title} style={{ height: 400 }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        height: chartHeight, 
        padding: '20px',
        justifyContent: 'center'
      }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * (chartHeight - 40) : 0;
          return (
            <div 
              key={index}
              style={{
                width: barWidth,
                height: barHeight,
                backgroundColor: '#1890ff',
                margin: `0 ${spacing/2}px`,
                position: 'relative',
                borderRadius: '4px 4px 0 0'
              }}
            >
              <div style={{
                position: 'absolute',
                bottom: -25,
                left: 0,
                width: '100%',
                textAlign: 'center',
                fontSize: '12px'
              }}>
                {item.time || index}
              </div>
              <div style={{
                position: 'absolute',
                top: -25,
                left: 0,
                width: '100%',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {Math.round(item.value)}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default SimpleChart;