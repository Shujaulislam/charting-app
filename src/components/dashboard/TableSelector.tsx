// src/components/dashboard/TableSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '../ui/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface TableSelectorProps {
  onTableSelect: (table: string) => void;
  onColumnsSelect: (columns: string[]) => void;
}

export function TableSelector({ onTableSelect, onColumnsSelect }: TableSelectorProps) {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tables on component mount
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/tables');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tables');
      }

      console.log('Tables received:', data.tables);
      setTables(data.tables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchColumns = async (table: string) => {
    if (!table) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/columns?table=${encodeURIComponent(table)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch columns');
      }

      console.log('Columns received:', data.columns);
      setColumns(data.columns);
      setSelectedColumns([]); // Reset selected columns
    } catch (error) {
      console.error('Error fetching columns:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch columns');
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (value: string) => {
    console.log('Table selected:', value);
    setSelectedTable(value);
    onTableSelect(value);
    fetchColumns(value);
  };

  const handleColumnToggle = (column: string) => {
    const isSelected = selectedColumns.includes(column);
    const newSelection = isSelected
      ? selectedColumns.filter(c => c !== column)
      : [...selectedColumns, column];
    
    console.log('Columns selected:', newSelection);
    setSelectedColumns(newSelection);
    onColumnsSelect(newSelection);
  };

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-red-500">{error}</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label>Select Table</Label>
        <Select
          disabled={loading}
          value={selectedTable}
          onValueChange={handleTableChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a table..." />
          </SelectTrigger>
          <SelectContent>
            {tables.map((table) => (
              <SelectItem key={table} value={table}>
                {table}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="flex justify-center p-4">
          <LoadingSpinner />
        </div>
      )}

      {selectedTable && !loading && (
        <div className="space-y-2">
          <Label>Select Columns</Label>
          <div className="border rounded-md p-4 space-y-2">
            {columns.map((column) => (
              <label
                key={column}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(column)}
                  onChange={() => handleColumnToggle(column)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span>{column}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}