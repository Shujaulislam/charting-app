// src/store/dashboard.ts
import { create } from 'zustand';

export type ChartAggregation = 'none' | 'sum' | 'count' | 'average';

export interface ChartConfig {
  id: string;
  chartType: 'bar' | 'line' | 'pie' | 'histogram';
  xAxis: string | null;
  yAxes: string[];
  aggregation: ChartAggregation;
  title?: string;
}

type DashboardState = {
  selectedTable: string | null;
  selectedColumns: string[];
  charts: ChartConfig[];
  addChart: (config: Omit<ChartConfig, 'id'>) => void;
  updateChart: (id: string, config: Partial<ChartConfig>) => void;
  deleteChart: (id: string) => void;
  setSelectedTable: (table: string | null) => void;
  setSelectedColumns: (columns: string[]) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedTable: null,
  selectedColumns: [],
  charts: [],
  
  addChart: (config) => set((state) => ({
    charts: [...state.charts, {
      ...config,
      id: Math.random().toString(36).substring(7)
    }]
  })),
  
  updateChart: (id, config) => set((state) => ({
    charts: state.charts.map(chart => 
      chart.id === id ? { ...chart, ...config } : chart
    )
  })),
  
  deleteChart: (id) => set((state) => ({
    charts: state.charts.filter(chart => chart.id !== id)
  })),
  
  setSelectedTable: (table) => set({ selectedTable: table }),
  setSelectedColumns: (columns) => set({ selectedColumns: columns })
}));