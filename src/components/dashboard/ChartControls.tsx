'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDashboardStore, ChartConfig, ChartAggregation } from '@/store/dashboard';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '../ui/checkbox';
// import { Checkbox } from '@/components/ui/checkbox';

interface ChartControlsProps {
  availableColumns: string[];
}

export function ChartControls({ availableColumns }: ChartControlsProps) {
  const { 
    selectedTable,
    addChart,
    deleteChart,
    charts
  } = useDashboardStore();

  // Local state for new chart configuration
  const [newChart, setNewChart] = useState<Omit<ChartConfig, 'id'>>({
    chartType: 'bar',
    xAxis: null,
    yAxes: [],
    aggregation: 'none',
    title: ''
  });

  // Chart type options
  const chartTypes = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'histogram', label: 'Histogram' }
  ] as const;

  // Aggregation options
  const aggregationTypes = [
    { value: 'none', label: 'None' },
    { value: 'sum', label: 'Sum' },
    { value: 'count', label: 'Count' },
    { value: 'average', label: 'Average' }
  ] as const;

  // Handle chart addition
  const handleAddChart = () => {
    if (!newChart.xAxis || newChart.yAxes.length === 0) return;
    addChart(newChart);
    // Reset form
    setNewChart({
      chartType: 'bar',
      xAxis: null,
      yAxes: [],
      aggregation: 'none',
      title: ''
    });
  };

  // Handle y-axis selection
  const handleYAxisToggle = (column: string) => {
    setNewChart(prev => {
      const yAxes = prev.yAxes.includes(column)
        ? prev.yAxes.filter(y => y !== column)
        : [...prev.yAxes, column];

      // For pie charts, only allow one y-axis
      if (prev.chartType === 'pie' && yAxes.length > 1) {
        return { ...prev, yAxes: [column] };
      }

      return { ...prev, yAxes };
    });
  };

  if (!selectedTable) return null;

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label>Chart Title</Label>
        <Input
          value={newChart.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            setNewChart(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter chart title"
        />
      </div>

      <div className="space-y-2">
        <Label>Chart Type</Label>
        <Select
          value={newChart.chartType}
          onValueChange={(value: ChartConfig['chartType']) => 
            setNewChart(prev => ({ 
              ...prev, 
              chartType: value,
              // Reset y-axes if switching to pie chart
              yAxes: value === 'pie' ? prev.yAxes.slice(0, 1) : prev.yAxes
            }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select chart type" />
          </SelectTrigger>
          <SelectContent>
            {chartTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>X-Axis</Label>
        <Select
          value={newChart.xAxis || ''}
          onValueChange={(value: string) => 
            setNewChart(prev => ({ ...prev, xAxis: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select x-axis" />
          </SelectTrigger>
          <SelectContent>
            {availableColumns.map(column => (
              <SelectItem key={column} value={column}>
                {column}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Y-Axis {newChart.chartType === 'pie' && '(single selection)'}</Label>
        <div className="border rounded-md p-2 space-y-2">
          {availableColumns.map(column => (
            <label
              key={column}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <Checkbox
                checked={newChart.yAxes.includes(column)}
                onCheckedChange={() => handleYAxisToggle(column)}
              />
              <span>{column}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Aggregation</Label>
        <Select
          value={newChart.aggregation}
          onValueChange={(value: ChartAggregation) => 
            setNewChart(prev => ({ 
              ...prev, 
              aggregation: value
            }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select aggregation" />
          </SelectTrigger>
          <SelectContent>
            {aggregationTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={handleAddChart}
        disabled={!newChart.xAxis || newChart.yAxes.length === 0}
        className="w-full"
      >
        Add Chart
      </Button>

      {charts.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="font-semibold">Current Charts</h3>
          {charts.map(chart => (
            <div key={chart.id} className="flex items-center justify-between">
              <span>{chart.title || `${chart.chartType} chart`}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteChart(chart.id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
} 