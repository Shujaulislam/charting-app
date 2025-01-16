// src/components/dashboard/DataTable.tsx
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '../ui/loading-spinner';
import { useState } from 'react';

type DataTableProps = {
  table: string;
  columns: string[];
  filters?: { column: string; value: string }[];
};

export function DataTable({ table, columns, filters = [] }: DataTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['tableData', table, columns, page, pageSize, filters],
    queryFn: async () => {
      if (!table || !columns.length) return null;
      
      const params = new URLSearchParams({
        table,
        columns: columns.join(','),
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      // Add filters to params
      filters.forEach((filter, index) => {
        params.append(`filter_column_${index}`, filter.column);
        params.append(`filter_value_${index}`, filter.value);
      });

      const response = await fetch(`/api/data?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }
      return response.json();
    },
    enabled: Boolean(table && columns.length > 0)
  });

  if (!table || !columns.length) {
    return (
      <div className="text-center p-4 text-gray-500">
        Select a table and columns to view data
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-4 text-red-500">
        Error: {error instanceof Error ? error.message : 'Failed to load data'}
      </div>
    );
  }

  if (!data?.rows?.length) {
    return (
      <div className="text-center p-4 text-gray-500">
        No data found in selected table
      </div>
    );
  }

  const pagination = data.pagination;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row: any, i: number) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {row[column]?.toString() ?? 'NULL'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-gray-500">
          Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, pagination.total)} of {pagination.total} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {page} of {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}