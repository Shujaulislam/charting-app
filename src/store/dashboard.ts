/**
 * Dashboard State Management Module
 * Uses Zustand for global state management of the dashboard
 * Handles chart configurations, selected tables, and data refresh
 */

import { create } from 'zustand';
import { ChartType, ChartAggregation } from '@/types';

/**
 * Represents a single chart configuration
 */
interface ChartConfig {
  id: string;
  title: string;
  chartType: ChartType;
  xAxis: string;
  yAxes: string[];
  aggregation: ChartAggregation;
}

/**
 * Dashboard state interface
 * Contains all state related to the dashboard's functionality
 */
interface DashboardState {
  // Selected table and columns
  selectedTable: string | null;
  selectedColumns: string[];
  
  // Chart configurations
  charts: ChartConfig[];
  
  // Actions
  setSelectedTable: (table: string | null) => void;
  setSelectedColumns: (columns: string[]) => void;
  addChart: (config: Omit<ChartConfig, 'id'>) => void;
  updateChart: (id: string, config: Partial<ChartConfig>) => void;
  deleteChart: (id: string) => void;
  
  // Data refresh trigger
  refreshTrigger: number;
  triggerRefresh: () => void;
}

/**
 * Creates the dashboard store using Zustand
 * Provides actions to modify the dashboard state
 */
export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial state
  selectedTable: null,
  selectedColumns: [],
  charts: [],
  refreshTrigger: 0,

  // Table and column selection
  setSelectedTable: (table) => set({ selectedTable: table, selectedColumns: [] }),
  setSelectedColumns: (columns) => set({ selectedColumns: columns }),

  // Chart management
  addChart: (config) => set((state) => ({
    charts: [...state.charts, { ...config, id: crypto.randomUUID() }]
  })),
  
  updateChart: (id, config) => set((state) => ({
    charts: state.charts.map((chart) =>
      chart.id === id ? { ...chart, ...config } : chart
    )
  })),
  
  deleteChart: (id) => set((state) => ({
    charts: state.charts.filter((chart) => chart.id !== id)
  })),

  // Data refresh
  triggerRefresh: () => set((state) => ({
    refreshTrigger: state.refreshTrigger + 1
  }))
}));