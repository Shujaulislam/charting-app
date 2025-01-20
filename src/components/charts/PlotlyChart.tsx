'use client';

/**
 * PlotlyChart Component
 * A flexible charting component that supports multiple chart types using Plotly.js
 * Handles data fetching, loading states, and different chart configurations
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ChartType, ChartAggregation } from '@/types';

// Dynamically import Plotly to prevent SSR issues
// Plotly requires browser APIs that aren't available during server-side rendering
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

/**
 * Props for the PlotlyChart component
 * @property {string} table - The database table to fetch data from
 * @property {string} xAxis - The column to use for x-axis values
 * @property {string[]} yAxes - Array of columns to use for y-axis values (multiple series)
 * @property {'bar' | 'line' | 'pie' | 'histogram'} chartType - The type of chart to render
 * @property {ChartAggregation} aggregation - How to aggregate the data (e.g., 'sum', 'avg')
 */
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
  // Fetch chart data using React Query for automatic caching and revalidation
  const { data, isLoading, error } = useQuery({
    queryKey: ['chartData', table, xAxis, yAxes, chartType, aggregation],
    queryFn: async () => {
      // Build query parameters for the API request
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

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  // Display error message if data fetching fails
  if (error) {
    return (
      <div className="text-center text-red-500">
        Error: {error instanceof Error ? error.message : 'Failed to load chart data'}
      </div>
    );
  }

  // Show message when no data is available
  if (!data?.data) {
    return (
      <div className="text-center text-gray-500">
        No data available
      </div>
    );
  }

  // Special handling for pie charts
  // Pie charts only support a single series (first y-axis)
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
          margin: { t: 30, r: 30, b: 30, l: 30 }, // Adjust margins for better fit
          showlegend: false // Hide legend for pie charts
        }}
        config={{
          displayModeBar: false, // Hide the Plotly toolbar
          responsive: true // Enable responsive resizing
        }}
      />
    );
  }

  // Handle bar, line, and histogram charts
  // These chart types support multiple series (y-axes)
  const plotData = data.data.map((series: any) => {
    // Base configuration for all non-pie charts
    const baseTrace = {
      name: series.name,
      x: series.data.map((d: any) => d.x),
      y: series.data.map((d: any) => d.y),
      type: chartType === 'histogram' ? 'histogram' : chartType,
    };

    // Special handling for bar charts with multiple series
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
        showlegend: data.data.length > 1, // Show legend only for multiple series
        legend: {
          orientation: 'h', // Horizontal legend
          y: -0.2 // Position below the chart
        },
        xaxis: {
          title: xAxis,
          type: 'category',
          tickangle: -45, // Angle labels for better readability
        },
        yaxis: {
          title: yAxes.join(', '), // Combine y-axis titles
          tickformat: ',.2f' // Format numbers with 2 decimal places
        },
        barmode: data.data.length > 1 ? 'group' as const : undefined // Group bars for multiple series
      }}
      config={{
        displayModeBar: false,
        responsive: true
      }}
    />
  );
} 