// src/lib/types.ts
export type PaginationParams = {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };