import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface ApiChartProps {
  title: string;
  data: Array<{ time: string; value: number }>;
  color?: string;
  unit?: string;
  height?: number;
  type?: 'line' | 'spline' | 'area' | 'column';
}

const ApiChart: React.FC<ApiChartProps> = ({ 
  title, 
  data, 
  color = '#1890ff', 
  unit = '', 
  height = 200,
  type = 'line'
}) => {
  if (data.length === 0) {
    return (
      <div style={{ 
        height: height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#999',
        border: '1px dashed #d9d9d9',
        borderRadius: '6px',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>📊</div>
          <div style={{ fontSize: '12px' }}>Aguardando dados...</div>
        </div>
      </div>
    );
  }

  // Configuração do ECharts
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: color,
      borderWidth: 2,
      borderRadius: 8,
      textStyle: {
        fontSize: 12,
        color: '#333'
      },
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: color,
          opacity: 0.6
        }
      },
      formatter: (params: any) => {
        const param = params[0];
        return `
          <div style="padding: 4px;">
            <div style="font-weight: bold; margin-bottom: 4px; color: #666;">${param.axisValue}</div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 50%;"></span>
              <span>${title}: <strong style="color: ${color};">${param.value}${unit}</strong></span>
            </div>
          </div>
        `;
      }
    },
    grid: {
      left: '8%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.time.split(':').slice(0, 2).join(':')),
      axisLine: {
        lineStyle: {
          color: '#e6e6e6'
        }
      },
      axisLabel: {
        fontSize: 10,
        color: '#666',
        interval: Math.ceil(data.length / 6) - 1
      },
      axisTick: {
        lineStyle: {
          color: '#e6e6e6'
        }
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: {
        color: '#666',
        fontSize: 11
      },
      axisLine: {
        show: false
      },
      axisLabel: {
        fontSize: 10,
        color: '#666',
        formatter: (value: number) => `${value}${unit}`
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'solid'
        }
      }
    },
    series: [
      {
        name: title,
        type: type === 'spline' ? 'line' : type === 'area' ? 'line' : type,
        data: data.map(item => item.value),
        smooth: type === 'spline',
        lineStyle: {
          width: 2.5,
          color: color
        },
        itemStyle: {
          color: color,
          borderWidth: 2,
          borderColor: '#fff'
        },
        emphasis: {
          itemStyle: {
            scale: 1.2,
            shadowBlur: 10,
            shadowColor: color,
            shadowOffsetX: 0,
            shadowOffsetY: 0
          }
        },
        symbol: data.length <= 15 ? 'circle' : 'none',
        symbolSize: 6,
        areaStyle: type === 'area' ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color },
            { offset: 1, color: echarts.color.modifyAlpha(color, 0.1) }
          ])
        } : undefined,
        animationDuration: 750,
        animationEasing: 'cubicOut'
      }
    ],
    animation: true,
    animationThreshold: 2000,
    animationDuration: 750,
    animationEasing: 'cubicOut'
  };

  return (
    <div style={{ width: '100%', height: height }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
        notMerge={true}
        lazyUpdate={true}
      />
      
      {/* Informações resumidas */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontSize: '10px', 
        color: '#999', 
        marginTop: '4px',
        padding: '0 4px'
      }}>
        <span>Mín: {Math.min(...data.map(d => d.value)).toFixed(1)}{unit}</span>
        <span>Último: {data[data.length - 1]?.value.toFixed(2)}{unit}</span>
        <span>Máx: {Math.max(...data.map(d => d.value)).toFixed(1)}{unit}</span>
      </div>
    </div>
  );
};

export default ApiChart;