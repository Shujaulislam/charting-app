'use client';

import { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// Types for our chart props and data
interface PlotlyChartProps {
  table: string;
  xAxis: string;
  yAxis: string | string[];
  chartType: 'bar' | 'line' | 'pie' | 'histogram';
}

interface ChartDataPoint {
  x?: any;
  y?: any;
  value?: any; // For histogram data points
  label?: string; // For pie chart labels
  percentage?: number; // For pie chart percentages
}

interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
}

interface ChartData {
  data: ChartSeries[];
  chartType: string;
  xAxis: string;
  yAxes: string[];
  isAggregated?: boolean;
  seriesFormat?: boolean;
}

// Color palette for multiple series
const SERIES_COLORS = [
  '#1f77b4', // blue
  '#ff7f0e', // orange
  '#2ca02c', // green
  '#d62728', // red
  '#9467bd', // purple
  '#8c564b', // brown
  '#e377c2', // pink
  '#7f7f7f', // gray
  '#bcbd22', // olive
  '#17becf', // cyan
];

export function PlotlyChart({ table, xAxis, yAxis, chartType }: PlotlyChartProps) {
  // Convert single yAxis to array for consistency
  const yAxes = Array.isArray(yAxis) ? yAxis : [yAxis];

  // For pie charts, enforce single y-axis
  if (chartType === 'pie' && yAxes.length > 1) {
    return (
      <Card className="p-4 h-[400px] flex items-center justify-center">
        <div className="text-red-500">Pie charts only support a single y-axis</div>
      </Card>
    );
  }

  // Fetch chart data using React Query
  const { data: chartData, isLoading, error } = useQuery<ChartData>({
    queryKey: ['chartData', table, xAxis, yAxes, chartType],
    queryFn: async () => {
      const params = new URLSearchParams({
        table,
        xAxis,
        yAxis: yAxes.join(','),
        chartType,
      });
      const response = await fetch(`/api/chart-data?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      return response.json();
    },
    enabled: Boolean(table && xAxis && yAxes.length > 0),
  });

  // Memoize the chart configuration to prevent unnecessary re-renders
  const chartConfig = useMemo(() => {
    if (!chartData?.data) return null;

    // Base layout configuration
    const layout = {
      autosize: true,
      margin: { t: 30, r: 10, b: 40, l: 40 },
      height: 400,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: {
        family: 'Arial, sans-serif'
      },
      title: chartData.isAggregated ? {
        text: 'Data is aggregated for better visualization',
        font: {
          size: 12,
          color: '#666'
        }
      } : undefined,
      showlegend: chartType !== 'histogram' && (chartData.data.length > 1 || chartType === 'pie')
    };

    // Configure data based on chart type
    switch (chartType) {
      case 'pie':
        const series = chartData.data[0];
        return {
          data: [{
            type: 'pie',
            labels: series.data.map(d => d.label),
            values: series.data.map(d => d.value),
            hole: 0.4,
            textinfo: 'label+percent',
            hoverinfo: 'label+value+percent',
            hovertemplate: 
              '%{label}<br>' +
              'Value: %{value:,.2f}<br>' +
              'Percentage: %{percent:.1%}<extra></extra>',
            marker: {
              colors: SERIES_COLORS
            },
            textposition: 'outside',
            texttemplate: '%{label}: %{percent:.1%}',
            insidetextorientation: 'horizontal'
          }],
          layout: {
            ...layout,
            legend: { 
              orientation: 'h',
              y: -0.2,
              xanchor: 'center',
              x: 0.5
            },
            annotations: [{
              text: series.name,
              showarrow: false,
              x: 0.5,
              y: 0.5,
              font: {
                size: 14
              }
            }]
          }
        };

      case 'histogram':
        // For histograms, we need to handle multiple series differently
        return {
          data: chartData.data.map((series, index) => ({
            type: 'histogram',
            x: series.data.map(d => d.value),
            name: series.name,
            marker: { 
              color: SERIES_COLORS[index % SERIES_COLORS.length],
              opacity: chartData.data.length > 1 ? 0.7 : 1
            },
            hovertemplate: 
              'Range: %{x}<br>' +
              'Count: %{y}<extra></extra>'
          })),
          layout: {
            ...layout,
            barmode: chartData.data.length > 1 ? 'overlay' : undefined,
            bargap: 0.1,
            xaxis: { 
              title: chartData.xAxis,
              tickformat: chartData.isAggregated ? ',.0f' : undefined
            },
            yaxis: { title: 'Count' }
          }
        };

      case 'line':
        return {
          data: chartData.data.map((series, index) => ({
            type: 'scatter',
            mode: 'lines+markers',
            name: series.name,
            x: series.data.map(d => d.x),
            y: series.data.map(d => d.y),
            line: { color: SERIES_COLORS[index % SERIES_COLORS.length] },
            marker: { color: SERIES_COLORS[index % SERIES_COLORS.length] },
            hovertemplate: `${chartData.xAxis}: %{x}<br>${series.name}: %{y:,.2f}<extra></extra>`
          })),
          layout: {
            ...layout,
            xaxis: { 
              title: chartData.xAxis,
              type: chartData.data[0]?.data[0]?.x instanceof Date ? 'date' : 'category'
            },
            yaxis: { 
              title: chartData.data.length === 1 ? chartData.data[0].name : 'Value',
              tickformat: ',.2f'
            }
          }
        };

      default: // bar chart
        return {
          data: chartData.data.map((series, index) => ({
            type: 'bar',
            name: series.name,
            x: series.data.map(d => d.x),
            y: series.data.map(d => d.y),
            marker: { color: SERIES_COLORS[index % SERIES_COLORS.length] },
            hovertemplate: `${chartData.xAxis}: %{x}<br>${series.name}: %{y:,.2f}<extra></extra>`
          })),
          layout: {
            ...layout,
            barmode: chartData.data.length > 1 ? 'group' : undefined,
            xaxis: { 
              title: chartData.xAxis,
              tickangle: -45
            },
            yaxis: { 
              title: chartData.data.length === 1 ? chartData.data[0].name : 'Value',
              tickformat: ',.2f'
            }
          }
        };
    }
  }, [chartData, chartType]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-4 h-[400px] flex items-center justify-center">
        <div className="text-gray-500">Loading chart...</div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-4 h-[400px] flex items-center justify-center">
        <div className="text-red-500">Error loading chart data</div>
      </Card>
    );
  }

  // No data state
  if (!chartConfig || !chartData?.data?.length) {
    return (
      <Card className="p-4 h-[400px] flex items-center justify-center">
        <div className="text-gray-500">No data available for chart</div>
      </Card>
    );
  }

  // Render the chart
  return (
    <Card className="p-4 h-[400px]">
      <Plot
        data={chartConfig.data}
        layout={chartConfig.layout}
        config={{
          responsive: true,
          displayModeBar: false,
          showTips: false
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </Card>
  );
} 