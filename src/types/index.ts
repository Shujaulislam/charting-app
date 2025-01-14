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
  
  export type ChartType = 'bar' | 'line' | 'pie' | 'histogram';