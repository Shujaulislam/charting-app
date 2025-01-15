'use client';

import { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// Types for our chart props
interface PlotlyChartProps {
  table: string;
  xAxis: string;
  yAxis: string;
  chartType: 'bar' | 'line' | 'pie' | 'histogram';
}

export function PlotlyChart({ table, xAxis, yAxis, chartType }: PlotlyChartProps) {
  // Fetch chart data using React Query
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ['chartData', table, xAxis, yAxis, chartType],
    queryFn: async () => {
      const params = new URLSearchParams({
        table,
        xAxis,
        yAxis,
        chartType,
      });
      const response = await fetch(`/api/chart-data?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      return response.json();
    },
    enabled: Boolean(table && xAxis && yAxis), // Only fetch when we have all parameters
  });

  // Memoize the chart configuration to prevent unnecessary re-renders
  const chartConfig = useMemo(() => {
    if (!chartData?.data) return null;

    // Base layout configuration
    const layout = {
      autosize: true,
      margin: { t: 10, r: 10, b: 40, l: 40 },
      height: 400,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: {
        family: 'Arial, sans-serif'
      }
    };

    // Configure data based on chart type
    switch (chartType) {
      case 'pie':
        return {
          data: [{
            type: 'pie',
            labels: chartData.data.map((d: any) => d.label),
            values: chartData.data.map((d: any) => d.value),
            hole: 0.4, // Makes it a donut chart
            textinfo: 'label+percent',
            hoverinfo: 'label+value',
          }],
          layout: {
            ...layout,
            showlegend: true,
            legend: { orientation: 'h', y: -0.1 }
          }
        };

      case 'histogram':
        return {
          data: [{
            type: 'histogram',
            x: chartData.data.map((d: any) => d.value),
            nbinsx: 20,
            name: yAxis,
          }],
          layout: {
            ...layout,
            bargap: 0.05,
            xaxis: { title: yAxis },
            yaxis: { title: 'Count' }
          }
        };

      case 'line':
        return {
          data: [{
            type: 'scatter',
            mode: 'lines+markers',
            x: chartData.data.map((d: any) => d.x),
            y: chartData.data.map((d: any) => d.y),
            name: yAxis,
          }],
          layout: {
            ...layout,
            xaxis: { title: xAxis },
            yaxis: { title: yAxis }
          }
        };

      default: // bar chart
        return {
          data: [{
            type: 'bar',
            x: chartData.data.map((d: any) => d.x),
            y: chartData.data.map((d: any) => d.y),
            name: yAxis,
          }],
          layout: {
            ...layout,
            xaxis: { title: xAxis },
            yaxis: { title: yAxis }
          }
        };
    }
  }, [chartData, chartType, xAxis, yAxis]);

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
          displayModeBar: false, // Hide the modebar
          // Add any other Plotly config options here
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </Card>
  );
} 