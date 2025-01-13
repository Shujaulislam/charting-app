// src/components/dashboard/DataTable.tsx
'use client';

import { useState } from 'react';
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

type DataTableProps = {
  table: string;
  columns: string[];
};

export function DataTable({ table, columns }: DataTableProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 50;

  const { data, isLoading, error } = useQuery({
    queryKey: ['tableData', table, columns, page, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        table,
        columns: columns.join(','),
        page: page.toString(),
        limit: limit.toString(),
        ...(sortBy && { sortBy, sortOrder })
      });

      const response = await fetch(`/api/data?${params}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      return response.json();
    }
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(column => (
              <TableHead
                key={column}
                className="cursor-pointer"
                onClick={() => handleSort(column)}
              >
                {column}
                {sortBy === column && (
                  <span className="ml-2">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.data.map((row: any, i: number) => (
            <TableRow key={i}>
              {columns.map(column => (
                <TableCell key={column}>
                  {row[column]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center">
        <div>
          Page {page} of {data?.pagination.totalPages}
        </div>
        <div className="space-x-2">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= data?.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}