import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';

type Point = { time: string; value: number };

interface SeriesItem {
  name: string;
  data: Point[];
  color?: string;
  type?: 'line' | 'bar' | 'scatter' | 'area';
  smooth?: boolean;
  stack?: string;
}

interface MultiSeriesChartProps {
  title: string;
  series: SeriesItem[];
  unit?: string;
  height?: number;
  type?: 'line' | 'spline' | 'area' | 'column' | 'bar' | 'scatter' | 'mixed';
  theme?: 'light' | 'dark' | 'modern';
  showDataZoom?: boolean;
  showBrush?: boolean;
  showLegend?: boolean;
  gradient?: boolean;
  animation?: 'smooth' | 'elastic' | 'bounce' | 'none';
  stacked?: boolean;
  showGrid?: boolean;
}

const modernPalette = [
  '#1890ff', '#13c2c2', '#9254de', '#f5222d', '#fa8c16', 
  '#2f54eb', '#52c41a', '#eb2f96', '#722ed1', '#fa541c'
];

const MultiSeriesChart: React.FC<MultiSeriesChartProps> = ({ 
  title, 
  series, 
  unit = '', 
  height = 240, 
  type = 'line',
  theme = 'modern',
  showDataZoom = false,
  showBrush = false,
  showLegend = true,
  gradient = true,
  animation = 'smooth',
  stacked = false,
  showGrid = true
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || series.length === 0) return;

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
            axis: '#666',
            title: '#fff'
          };
        case 'modern':
          return {
            bg: 'transparent',
            text: '#2c3e50',
            grid: '#ecf0f1',
            axis: '#7f8c8d',
            title: '#34495e'
          };
        default:
          return {
            bg: 'transparent',
            text: '#333',
            grid: '#f0f0f0',
            axis: '#666',
            title: '#333'
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

    // Get x-axis data from the first series
    const xAxisData = series[0]?.data.map(d => d.time.split(':').slice(0, 2).join(':')) || [];

    // Enhanced tooltip with modern design
    const tooltip = {
      trigger: 'axis',
      backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: modernPalette[0],
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
          color: modernPalette[0],
          opacity: 0.8,
          width: 1
        },
        lineStyle: {
          type: 'dashed'
        }
      },
      formatter: (params: any) => {
        if (!Array.isArray(params)) params = [params];
        
        let result = `
          <div style="padding: 4px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: ${themeColors.text};">${params[0].axisValue}</div>
        `;
        
        params.forEach((param: any) => {
          result += `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: ${param.color}; border-radius: 50%;"></span>
              <span style="font-weight: 500;">${param.seriesName}: <strong style="color: ${param.color};">${param.value}${unit}</strong></span>
            </div>
          `;
        });
        
        result += '</div>';
        return result;
      }
    };

    // Base configuration
    const baseOption: any = {
      backgroundColor: themeColors.bg,
      title: {
        text: title,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 14,
          color: themeColors.title,
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif'
        }
      },
      tooltip,
      ...animConfig,
      animation: animation !== 'none',
      animationThreshold: 2000
    };

    // Add legend if enabled
    if (showLegend && series.length > 1) {
      baseOption.legend = {
        top: 35,
        left: 'center',
        textStyle: {
          color: themeColors.text,
          fontSize: 12,
          fontFamily: 'Inter, sans-serif'
        },
        itemGap: 20,
        icon: 'roundRect',
        itemWidth: 14,
        itemHeight: 8
      };
    }

    // Add DataZoom if enabled
    if (showDataZoom) {
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
          borderColor: modernPalette[0],
          fillerColor: echarts.color.modifyAlpha(modernPalette[0], 0.2),
          handleStyle: {
            color: modernPalette[0]
          }
        }
      ];
    }

    // Add Brush if enabled
    if (showBrush) {
      baseOption.brush = {
        toolbox: ['rect', 'polygon', 'clear'],
        xAxisIndex: 0
      };
    }

    // Grid configuration
    baseOption.grid = {
      left: '8%',
      right: '4%',
      bottom: showDataZoom ? '20%' : '15%',
      top: showLegend && series.length > 1 ? '20%' : '15%',
      containLabel: true,
      show: showGrid,
      borderColor: themeColors.grid
    };

    // X-axis configuration
    baseOption.xAxis = {
      type: 'category',
      data: xAxisData,
      axisLine: {
        lineStyle: {
          color: themeColors.axis
        }
      },
      axisLabel: {
        fontSize: 11,
        color: themeColors.text,
        interval: Math.ceil(xAxisData.length / 8) - 1,
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

    // Y-axis configuration
    baseOption.yAxis = {
      type: 'value',
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

    // Series configuration
    baseOption.series = series.map((seriesItem, index) => {
      const color = seriesItem.color || modernPalette[index % modernPalette.length];
      const seriesType = type === 'mixed' ? (seriesItem.type || 'line') : 
                        type === 'spline' ? 'line' : 
                        type === 'area' ? 'line' : 
                        type === 'column' ? 'bar' : type;

      const seriesConfig: any = {
        name: seriesItem.name,
        type: seriesType,
        data: seriesItem.data.map(p => p.value),
        smooth: type === 'spline' || seriesItem.smooth || (type === 'area'),
        stack: stacked ? 'total' : (seriesItem.stack || undefined),
        ...animConfig
      };

      // Line and area specific configurations
      if (seriesType === 'line') {
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

        seriesConfig.symbol = xAxisData.length <= 20 ? 'circle' : 'none';
        seriesConfig.symbolSize = 8;

        // Add area style if it's an area chart
        if (type === 'area' || seriesItem.type === 'area') {
          seriesConfig.areaStyle = {
            color: gradient ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: echarts.color.modifyAlpha(color, 0.6) },
              { offset: 1, color: echarts.color.modifyAlpha(color, 0.1) }
            ]) : echarts.color.modifyAlpha(color, 0.3)
          };
        }
      }
      
      // Bar specific configurations
      else if (seriesType === 'bar') {
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
      }
      
      // Scatter specific configurations
      else if (seriesType === 'scatter') {
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

      return seriesConfig;
    });

    chartInstance.current.setOption(baseOption, true);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [title, series, unit, type, theme, showDataZoom, showBrush, showLegend, gradient, animation, stacked, showGrid]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100%', height }}>
      <div ref={chartRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default MultiSeriesChart;