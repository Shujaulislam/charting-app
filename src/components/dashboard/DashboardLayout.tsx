// src/components/dashboard/DashboardLayout.tsx
'use client';

import { useState } from 'react';
import { TableSelector } from './TableSelector';
import { DataTable } from './DataTable';
import { Button } from '../ui/button';
import { PlotlyChart } from '../charts/PlotlyChart';
import { useDashboardStore } from '@/store/dashboard';
import { useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '../ui/scroll-area';
import { ChartControls } from './ChartControls';

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
    charts
  } = useDashboardStore();

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ['tableData', 'chartData']
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

  const handleFiltersChange = (filters: readonly ColumnFilter[]) => {
    setActiveFilters([...filters]);
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
                  {/* Comment out filter-related components */}
                  {/*
                  <ColumnFilters
                    table={selectedTable}
                    columns={selectedColumns}
                    onFiltersChange={(filters) => handleFiltersChange([...filters])}
                  />
                  */}
                </div>

                <ChartControls availableColumns={selectedColumns} />

                <Button
                  onClick={handleExport}
                  className="w-full"
                >
                  Export to CSV
                </Button>
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
              {charts.map(chart => (
                <div key={chart.id} className="space-y-4">
                  {chart.title && (
                    <h3 className="text-lg font-semibold">{chart.title}</h3>
                  )}
                  <PlotlyChart
                    table={selectedTable}
                    xAxis={chart.xAxis || ''}
                    yAxes={chart.yAxes}
                    chartType={chart.chartType}
                    aggregation={chart.aggregation}
                  />
                </div>
              ))}

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