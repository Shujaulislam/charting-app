// src/components/charts/ChartWrapper.tsx
'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

type ChartWrapperProps = {
  data: any[];
  type: 'bar' | 'line' | 'pie' | 'histogram';
  xAxis: string;
  yAxis: string;
};

export function ChartWrapper({ data, type, xAxis, yAxis }: ChartWrapperProps) {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={yAxis} stroke="#8884d8" />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={yAxis}
              nameKey={xAxis}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case 'histogram':
        // For histogram, we'll need to process the data first
        const processedData = processHistogramData(data, yAxis);
        return (
          <BarChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="frequency" fill="#8884d8" />
          </BarChart>
        );

      default:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={yAxis} fill="#8884d8" />
          </BarChart>
        );
    }
  };

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

// Helper function to process histogram data
function processHistogramData(data: any[], field: string) {
  const values = data.map(d => Number(d[field])).filter(n => !isNaN(n));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binCount = 10;
  const binSize = (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => ({
    bin: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
    frequency: 0
  }));

  values.forEach(value => {
    const binIndex = Math.min(
      Math.floor((value - min) / binSize),
      binCount - 1
    );
    bins[binIndex].frequency++;
  });

  return bins;
}