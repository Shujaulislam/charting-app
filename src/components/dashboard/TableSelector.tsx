// src/components/dashboard/TableSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export function TableSelector({
  onTableSelect,
  onColumnsSelect
}: {
  onTableSelect: (table: string) => void;
  onColumnsSelect: (columns: string[]) => void;
}) {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>();
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables');
      const data = await response.json();
      setTables(data.tables);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  const fetchColumns = async (table: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/columns?table=${table}`);
      const data = await response.json();
      setColumns(data.columns.map((c: any) => c.Field));
    } catch (error) {
      console.error('Failed to fetch columns:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <Select
          value={selectedTable}
          onChange={(value) => {
            setSelectedTable(value);
            onTableSelect(value);
            fetchColumns(value);
          }}
          options={tables.map(t => ({ label: t, value: t }))}
          placeholder="Select a table"
        />
        
        <Select
          isMulti
          isLoading={loading}
          options={columns.map(c => ({ label: c, value: c }))}
          onChange={(values) => {
            onColumnsSelect(values.map(v => v.value));
          }}
          placeholder="Select columns"
        />
      </div>
    </Card>
  );
}