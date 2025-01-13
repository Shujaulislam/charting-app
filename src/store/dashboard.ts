// src/store/dashboard.ts
import { create } from 'zustand';

type DashboardState = {
  selectedTable: string | null;
  selectedColumns: string[];
  chartType: 'bar' | 'line' | 'pie' | 'histogram';
  chartConfig: {
    xAxis: string | null;
    yAxis: string | null;
  };
  setSelectedTable: (table: string | null) => void;
  setSelectedColumns: (columns: string[]) => void;
  setChartType: (type: 'bar' | 'line' | 'pie' | 'histogram') => void;
  setChartConfig: (config: { xAxis: string | null; yAxis: string | null }) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedTable: null,
  selectedColumns: [],
  chartType: 'bar',
  chartConfig: {
    xAxis: null,
    yAxis: null,
  },
  setSelectedTable: (table) => set({ selectedTable: table }),
  setSelectedColumns: (columns) => set({ selectedColumns: columns }),
  setChartType: (type) => set({ chartType: type }),
  setChartConfig: (config) => set({ chartConfig: config }),
}));