'use client';

import { useQuery } from '@tanstack/react-query';
import Plot from 'react-plotly.js';
import { LoadingSpinner } from '../ui/loading-spinner';
import { ChartAggregation } from '@/store/dashboard';

interface PlotlyChartProps {
  table: string;
  xAxis: string;
  yAxes: string[];
  chartType: 'bar' | 'line' | 'pie' | 'histogram';
  aggregation: ChartAggregation;
}

export function PlotlyChart({ 
  table, 
  xAxis, 
  yAxes,
  chartType,
  aggregation 
}: PlotlyChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['chartData', table, xAxis, yAxes, chartType, aggregation],
    queryFn: async () => {
      const params = new URLSearchParams({
        table,
        xAxis,
        yAxis: yAxes.join(','),
        chartType,
        aggregation
      });

      const response = await fetch(`/api/chart-data?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error: {error instanceof Error ? error.message : 'Failed to load chart data'}
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="text-center text-gray-500">
        No data available
      </div>
    );
  }

  // For pie charts, we only use the first y-axis
  if (chartType === 'pie') {
    const pieData = [{
      type: 'pie',
      labels: data.data[0].data.map((d: any) => d.x),
      values: data.data[0].data.map((d: any) => d.y),
      textinfo: 'label+percent',
      textposition: 'outside' as const,
      insidetextorientation: 'horizontal' as const
    }];

    return (
      <Plot
        data={pieData}
        layout={{
          height: 400,
          margin: { t: 30, r: 30, b: 30, l: 30 },
          showlegend: false
        }}
        config={{
          displayModeBar: false,
          responsive: true
        }}
      />
    );
  }

  // For other chart types, handle multiple y-axes
  const plotData = data.data.map((series: any) => {
    const baseTrace = {
      name: series.name,
      x: series.data.map((d: any) => d.x),
      y: series.data.map((d: any) => d.y),
      type: chartType === 'histogram' ? 'histogram' : chartType,
    };

    if (chartType === 'bar') {
      return {
        ...baseTrace,
        barmode: data.data.length > 1 ? 'group' as const : undefined
      };
    }

    return baseTrace;
  });

  return (
    <Plot
      data={plotData}
      layout={{
        height: 400,
        margin: { t: 30, r: 30, b: 30, l: 30 },
        showlegend: data.data.length > 1,
        legend: {
          orientation: 'h',
          y: -0.2
        },
        xaxis: {
          title: xAxis,
          type: 'category',
          tickangle: -45,
        },
        yaxis: {
          title: yAxes.join(', '),
          tickformat: ',.2f'
        },
        barmode: data.data.length > 1 ? 'group' as const : undefined
      }}
      config={{
        displayModeBar: false,
        responsive: true
      }}
    />
  );
} 