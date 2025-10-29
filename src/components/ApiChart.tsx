import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';

interface ApiChartProps {
  title: string;
  data: Array<{ time: string; value: number }>;
  color?: string;
  unit?: string;
  height?: number;
  type?: 'line' | 'spline' | 'area' | 'column' | 'bar' | 'scatter' | 'heatmap' | 'gauge' | 'pie';
  theme?: 'light' | 'dark' | 'modern';
  showDataZoom?: boolean;
  showBrush?: boolean;
  gradient?: boolean;
  animation?: 'smooth' | 'elastic' | 'bounce' | 'none';
}

const ApiChart: React.FC<ApiChartProps> = ({ 
  title, 
  data, 
  color = '#1890ff', 
  unit = '', 
  height = 200,
  type = 'line',
  theme = 'dark',
  showDataZoom = false,
  showBrush = false,
  gradient = true,
  animation = 'smooth'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // Initialize chart with theme
    if (!chartInstance.current) {
      const themeConfig = theme === 'dark' ? 'dark' : undefined;
      chartInstance.current = echarts.init(chartRef.current, themeConfig, { 
        renderer: 'svg',
        useDirtyRect: true // Performance optimization for ECharts 6
      });
    }

    // Get theme colors
    const getThemeColors = () => {
      switch (theme) {
        case 'dark':
          return {
            bg: 'transparent',
            text: '#fff',
            grid: '#333',
            axis: '#666'
          };
        case 'modern':
          return {
            bg: 'transparent',
            text: '#2c3e50',
            grid: '#ecf0f1',
            axis: '#7f8c8d'
          };
        default:
          return {
            bg: 'transparent',
            text: '#333',
            grid: '#f0f0f0',
            axis: '#666'
          };
      }
    };

    const themeColors = getThemeColors();

    // Animation configurations
    const getAnimationConfig = () => {
      switch (animation) {
        case 'elastic':
          return {
            animationDuration: 1200,
            animationEasing: 'elasticOut' as const,
            animationDelay: (idx: number) => idx * 50
          };
        case 'bounce':
          return {
            animationDuration: 1000,
            animationEasing: 'bounceOut' as const,
            animationDelay: (idx: number) => idx * 30
          };
        case 'smooth':
          return {
            animationDuration: 800,
            animationEasing: 'cubicInOut' as const,
            animationDelay: (idx: number) => idx * 20
          };
        default:
          return {
            animation: false
          };
      }
    };

    const animConfig = getAnimationConfig();

    // Enhanced tooltip with modern design
    const tooltip = {
      trigger: type === 'pie' ? 'item' : 'axis',
      backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: color,
      borderWidth: 2,
      borderRadius: 12,
      textStyle: {
        fontSize: 13,
        color: themeColors.text,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      },
      padding: [12, 16],
      extraCssText: 'box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); backdrop-filter: blur(8px);',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: color,
          opacity: 0.8,
          width: 1
        },
        lineStyle: {
          type: 'dashed'
        }
      },
      formatter: (params: any) => {
        if (type === 'pie') {
          const param = params;
          return `
            <div style="padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: ${themeColors.text};">${param.name}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 12px; height: 12px; background-color: ${param.color}; border-radius: 50%;"></span>
                <span style="font-weight: 500;">${param.value}${unit} (${param.percent}%)</span>
              </div>
            </div>
          `;
        } else {
          const param = Array.isArray(params) ? params[0] : params;
          return `
            <div style="padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: ${themeColors.text};">${param.axisValue}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 12px; height: 12px; background-color: ${color}; border-radius: 50%;"></span>
                <span style="font-weight: 500;">${title}: <strong style="color: ${color};">${param.value}${unit}</strong></span>
              </div>
            </div>
          `;
        }
      }
    };

    // Base configuration
    const baseOption: any = {
      backgroundColor: themeColors.bg,
      tooltip,
      ...animConfig,
      animation: animation !== 'none',
      animationThreshold: 2000
    };

    // Add DataZoom if enabled
    if (showDataZoom && type !== 'pie' && type !== 'gauge') {
      baseOption.dataZoom = [
        {
          type: 'inside',
          start: 70,
          end: 100
        },
        {
          type: 'slider',
          start: 70,
          end: 100,
          height: 20,
          bottom: 10,
          borderColor: color,
          fillerColor: echarts.color.modifyAlpha(color, 0.2),
          handleStyle: {
            color: color
          }
        }
      ];
    }

    // Add Brush if enabled
    if (showBrush && type !== 'pie' && type !== 'gauge') {
      baseOption.brush = {
        toolbox: ['rect', 'polygon', 'clear'],
        xAxisIndex: 0
      };
    }

    // Configure based on chart type
    if (type === 'pie') {
      baseOption.series = [{
        name: title,
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        data: data.map((item, index) => ({
          name: item.time,
          value: item.value,
          itemStyle: {
            color: echarts.color.modifyHSL(color, (index * 30) % 360)
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}: {c}' + unit
        },
        ...animConfig
      }];
    } else if (type === 'gauge') {
      const maxValue = Math.max(...data.map(d => d.value));
      const currentValue = data[data.length - 1]?.value || 0;
      
      baseOption.series = [{
        name: title,
        type: 'gauge',
        radius: '80%',
        center: ['50%', '55%'],
        startAngle: 200,
        endAngle: -40,
        min: 0,
        max: maxValue * 1.2,
        splitNumber: 5,
        itemStyle: {
          color: color
        },
        progress: {
          show: true,
          width: 8,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: echarts.color.modifyAlpha(color, 0.3) },
              { offset: 1, color: color }
            ])
          }
        },
        pointer: {
          show: true,
          length: '60%',
          width: 4,
          itemStyle: {
            color: color
          }
        },
        axisLine: {
          lineStyle: {
            width: 8,
            color: [[1, echarts.color.modifyAlpha(color, 0.1)]]
          }
        },
        axisTick: {
          distance: -20,
          splitNumber: 2,
          lineStyle: {
            width: 1,
            color: themeColors.axis
          }
        },
        splitLine: {
          distance: -25,
          length: 8,
          lineStyle: {
            width: 2,
            color: themeColors.axis
          }
        },
        axisLabel: {
          distance: -35,
          color: themeColors.text,
          fontSize: 10
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}' + unit,
          color: themeColors.text,
          fontSize: 16,
          offsetCenter: [0, '80%']
        },
        data: [{ value: currentValue, name: title }],
        ...animConfig
      }];
    } else {
      // Standard charts (line, area, column, bar, scatter)
      baseOption.grid = {
        left: '8%',
        right: '4%',
        bottom: showDataZoom ? '20%' : '15%',
        top: '15%',
        containLabel: true
      };

      baseOption.xAxis = {
        type: type === 'bar' ? 'value' : 'category',
        data: type === 'bar' ? undefined : data.map(item => item.time.split(':').slice(0, 2).join(':')),
        axisLine: {
          lineStyle: {
            color: themeColors.axis
          }
        },
        axisLabel: {
          fontSize: 11,
          color: themeColors.text,
          interval: Math.ceil(data.length / 6) - 1,
          fontFamily: 'Inter, sans-serif'
        },
        axisTick: {
          lineStyle: {
            color: themeColors.axis
          }
        },
        splitLine: {
          show: false
        }
      };

      baseOption.yAxis = {
        type: type === 'bar' ? 'category' : 'value',
        data: type === 'bar' ? data.map(item => item.time.split(':').slice(0, 2).join(':')) : undefined,
        name: unit,
        nameTextStyle: {
          color: themeColors.text,
          fontSize: 12,
          fontFamily: 'Inter, sans-serif'
        },
        axisLine: {
          show: false
        },
        axisLabel: {
          fontSize: 11,
          color: themeColors.text,
          formatter: (value: number) => `${value}${unit}`,
          fontFamily: 'Inter, sans-serif'
        },
        axisTick: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: themeColors.grid,
            type: 'solid'
          }
        }
      };

      // Enhanced series configuration
      const seriesConfig: any = {
        name: title,
        type: type === 'spline' ? 'line' : type === 'area' ? 'line' : type === 'column' ? 'bar' : type,
        data: data.map(item => item.value),
        smooth: type === 'spline' || type === 'area',
        ...animConfig
      };

      if (type === 'line' || type === 'spline' || type === 'area') {
        seriesConfig.lineStyle = {
          width: 3,
          color: gradient ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: color },
            { offset: 1, color: echarts.color.modifyAlpha(color, 0.6) }
          ]) : color,
          shadowColor: echarts.color.modifyAlpha(color, 0.3),
          shadowBlur: 4,
          shadowOffsetY: 2
        };
        
        seriesConfig.itemStyle = {
          color: color,
          borderWidth: 2,
          borderColor: '#fff',
          shadowColor: echarts.color.modifyAlpha(color, 0.4),
          shadowBlur: 6
        };

        seriesConfig.emphasis = {
          itemStyle: {
            scale: 1.3,
            shadowBlur: 15,
            shadowColor: color,
            shadowOffsetX: 0,
            shadowOffsetY: 0
          },
          lineStyle: {
            width: 4
          }
        };

        seriesConfig.symbol = data.length <= 20 ? 'circle' : 'none';
        seriesConfig.symbolSize = 8;

        if (type === 'area') {
          seriesConfig.areaStyle = {
            color: gradient ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: echarts.color.modifyAlpha(color, 0.6) },
              { offset: 1, color: echarts.color.modifyAlpha(color, 0.1) }
            ]) : echarts.color.modifyAlpha(color, 0.3)
          };
        }
      } else if (type === 'bar' || type === 'column') {
        seriesConfig.itemStyle = {
          color: gradient ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color },
            { offset: 1, color: echarts.color.modifyAlpha(color, 0.7) }
          ]) : color,
          borderRadius: type === 'column' ? [4, 4, 0, 0] : [0, 4, 4, 0],
          shadowColor: echarts.color.modifyAlpha(color, 0.3),
          shadowBlur: 4,
          shadowOffsetY: 2
        };

        seriesConfig.emphasis = {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: color
          }
        };
      } else if (type === 'scatter') {
        seriesConfig.itemStyle = {
          color: color,
          shadowColor: echarts.color.modifyAlpha(color, 0.4),
          shadowBlur: 6
        };
        seriesConfig.symbolSize = 12;
        seriesConfig.emphasis = {
          itemStyle: {
            scale: 1.5,
            shadowBlur: 15,
            shadowColor: color
          }
        };
      }

      baseOption.series = [seriesConfig];
    }

    chartInstance.current.setOption(baseOption, true);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [title, data, color, unit, type]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

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

  return (
    <div style={{ width: '100%', height: height }}>
      <div ref={chartRef} style={{ height: '100%', width: '100%' }} />
      
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