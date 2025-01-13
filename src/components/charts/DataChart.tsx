// src/components/charts/DataChart.tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card } from '@/components/ui/card';

export function DataChart({
  data,
  xAxis,
  yAxis
}: {
  data: any[];
  xAxis: string;
  yAxis: string;
}) {
  return (
    <Card className="p-4 h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxis} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={yAxis} fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}