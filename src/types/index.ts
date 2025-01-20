// src/types/index.ts
export interface TableData {
    [key: string]: any;
  }
  
  export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  export interface ChartConfig {
    xAxis: string | null;
    yAxis: string | null;
  }

  /**
   * Represents the available chart types in the application
   * Used for type-safe chart selection and configuration
   */
  export type ChartType = 'bar' | 'line' | 'pie' | 'histogram';

  /**
   * Represents the available data aggregation methods
   * Used when grouping data for visualization
   */
  export type ChartAggregation = 'none' | 'sum' | 'avg' | 'count';

  /**
   * Represents a single data point in a chart
   * Used for consistent data structure across different chart types
   */
  export interface ChartDataPoint {
    x: string | number;
    y: number;
    label?: string;
    percentage?: number;
  }