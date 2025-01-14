// src/components/dashboard/DashboardLayout.tsx
'use client';

import { useState } from 'react';
import { TableSelector } from './TableSelector';
import { DataTable } from './DataTable';
import { Button } from '../ui/button';
import { ChartWrapper } from '../charts/ChartsWrapper';
import { useDashboardStore } from '@/store/dashboard';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnFilters } from './ColumnFilters';
import { ScrollArea } from '../ui/scroll-area';

type ColumnFilter = {
  column: string;
  value: string;
};

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFilters, setActiveFilters] = useState<ColumnFilter[]>([]);
  const queryClient = useQueryClient();
  const {
    selectedTable,
    selectedColumns,
    chartType,
    chartConfig,
    setChartConfig
  } = useDashboardStore();

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ['tableData']
    });
  };

  const handleExport = async () => {
    if (!selectedTable || !selectedColumns.length) return;
    
    const params = new URLSearchParams({
      table: selectedTable,
      columns: selectedColumns.join(',')
    });

    const response = await fetch(`/api/export?${params}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_export.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleFiltersChange = (filters: ColumnFilter[]) => {
    setActiveFilters(filters);
    // Invalidate the data query to trigger a refresh with new filters
    queryClient.invalidateQueries({
      queryKey: ['tableData']
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-80 min-w-[320px]' : 'w-0'
        } transition-all duration-300 bg-gray-50 border-r overflow-hidden flex flex-col`}
      >
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <TableSelector
              onTableSelect={(table) => {
                useDashboardStore.getState().setSelectedTable(table);
                setActiveFilters([]); // Clear filters when table changes
              }}
              onColumnsSelect={(columns) => {
                useDashboardStore.getState().setSelectedColumns(columns);
                setActiveFilters([]); // Clear filters when columns change
              }}
            />
            
            {selectedTable && selectedColumns.length > 0 && (
              <>
                <div className="space-y-4">
                  <ColumnFilters
                    table={selectedTable}
                    columns={selectedColumns}
                    onFiltersChange={handleFiltersChange}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chart Type</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={chartType}
                      onChange={(e) => useDashboardStore.getState().setChartType(
                        e.target.value as any
                      )}
                    >
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="pie">Pie Chart</option>
                      <option value="histogram">Histogram</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">X-Axis</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={chartConfig.xAxis || ''}
                      onChange={(e) => setChartConfig({
                        ...chartConfig,
                        xAxis: e.target.value
                      })}
                    >
                      <option value="">Select Column</option>
                      {selectedColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Y-Axis</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={chartConfig.yAxis || ''}
                      onChange={(e) => setChartConfig({
                        ...chartConfig,
                        yAxis: e.target.value
                      })}
                    >
                      <option value="">Select Column</option>
                      {selectedColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  <Button
                    onClick={handleExport}
                    className="w-full"
                  >
                    Export to CSV
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <Button onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
            </Button>
            <Button onClick={handleRefresh}>
              Refresh Data
            </Button>
          </div>

          {selectedTable && selectedColumns.length > 0 ? (
            <div className="space-y-8">
              {chartConfig.xAxis && chartConfig.yAxis && (
                <ChartWrapper
                  data={[]} // This will be populated from your data query
                  type={chartType}
                  xAxis={chartConfig.xAxis}
                  yAxis={chartConfig.yAxis}
                />
              )}

              <DataTable
                table={selectedTable}
                columns={selectedColumns}
                filters={activeFilters}
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              Select a table and columns to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}