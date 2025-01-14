'use client';

import { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ColumnFilter = {
  column: string;
  value: string;
};

type DistinctValue = {
  value: string | number | null;
  count: number;
};

interface ColumnFiltersProps {
  table: string;
  columns: string[];
  onFiltersChange: (filters: ColumnFilter[]) => void;
}

export function ColumnFilters({ table, columns, onFiltersChange }: ColumnFiltersProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [distinctValues, setDistinctValues] = useState<Record<string, DistinctValue[]>>({});
  const [excludedColumns, setExcludedColumns] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<ColumnFilter[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [searchValue, setSearchValue] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    console.log('ColumnFilters mounted with:', { table, columns });
    if (table && columns.length > 0) {
      fetchDistinctValuesForColumns();
    }
  }, [table, columns]);

  const fetchDistinctValuesForColumns = async () => {
    console.log('Fetching distinct values for columns:', columns);
    const newDistinctValues: Record<string, DistinctValue[]> = {};
    const newExcludedColumns: string[] = [];

    for (const column of columns) {
      setLoading(prev => ({ ...prev, [column]: true }));
      try {
        const url = `/api/distinct-values?table=${encodeURIComponent(table)}&column=${encodeURIComponent(column)}`;
        console.log('Fetching from:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        console.log(`Received data for column ${column}:`, data);

        if (data.isIdColumn) {
          console.log(`Column ${column} excluded as ID column`);
          newExcludedColumns.push(column);
          toast({
            title: "Column Excluded",
            description: `${column} was excluded from filtering as it contains mostly unique values.`,
          });
        } else if (!Array.isArray(data.values)) {
          console.error(`Invalid values format for column ${column}:`, data.values);
          toast({
            variant: "destructive",
            title: "Error",
            description: `Invalid data format received for ${column}`,
          });
        } else {
          newDistinctValues[column] = data.values;
          console.log(`Stored distinct values for ${column}:`, data.values);
        }
      } catch (error) {
        console.error(`Error fetching distinct values for ${column}:`, error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to fetch values for ${column}`,
        });
      } finally {
        setLoading(prev => ({ ...prev, [column]: false }));
      }
    }

    console.log('Final distinct values:', newDistinctValues);
    console.log('Excluded columns:', newExcludedColumns);
    setDistinctValues(newDistinctValues);
    setExcludedColumns(newExcludedColumns);
  };

  const handleFilterChange = (column: string, value: string | null) => {
    console.log('handleFilterChange called with:', { column, value });
    console.log('Current active filters:', activeFilters);
    
    let newFilters: ColumnFilter[];
    
    if (value === null) {
      console.log('Removing filter for column:', column);
      newFilters = activeFilters.filter(f => f.column !== column);
    } else {
      const existingFilterIndex = activeFilters.findIndex(f => f.column === column);
      console.log('Existing filter index:', existingFilterIndex);
      
      if (existingFilterIndex >= 0) {
        newFilters = [...activeFilters];
        newFilters[existingFilterIndex] = { column, value: value.toString() };
        console.log('Updating existing filter:', newFilters[existingFilterIndex]);
      } else {
        const newFilter = { column, value: value.toString() };
        newFilters = [...activeFilters, newFilter];
        console.log('Adding new filter:', newFilter);
      }
    }

    console.log('Setting new filters:', newFilters);
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilter = (column: string) => {
    console.log('Clearing filter for column:', column);
    handleFilterChange(column, null);
  };

  const clearAllFilters = () => {
    console.log('Clearing all filters');
    setActiveFilters([]);
    onFiltersChange([]);
  };

  if (!table || columns.length === 0) {
    console.log('No table or columns provided');
    return null;
  }

  const filterableColumns = columns.filter(col => !excludedColumns.includes(col));
  console.log('Renderable columns:', filterableColumns);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Filter Columns</Label>
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
          >
            Clear all filters
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {filterableColumns.map((column) => {
          const values = distinctValues[column] || [];
          console.log(`Rendering column ${column} with values:`, values);
          
          return (
            <div key={column} className="flex items-center space-x-2">
              <Popover 
                open={openPopover === column} 
                onOpenChange={(open) => {
                  console.log(`Popover ${column} ${open ? 'opened' : 'closed'}`);
                  if (open) {
                    setSearchValue('');
                  }
                  setOpenPopover(open ? column : null);
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPopover === column}
                    className="justify-between w-[250px]"
                    disabled={loading[column]}
                  >
                    {loading[column] ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <span>{column}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder={`Search ${column} values...`} 
                      value={searchValue}
                      onValueChange={(value) => {
                        console.log('Search value changed:', value);
                        setSearchValue(value);
                      }}
                    />
                    <CommandEmpty>No values found.</CommandEmpty>
                    <CommandGroup>
                      {values
                        .filter(item => {
                          const matches = item.value?.toString().toLowerCase().includes(searchValue.toLowerCase());
                          console.log('Filtering item:', { value: item.value, matches });
                          return matches;
                        })
                        .map((item) => {
                          const itemValue = item.value?.toString() ?? '';
                          const isSelected = activeFilters.some(
                            f => f.column === column && f.value === itemValue
                          );
                          console.log('Rendering item:', { 
                            value: itemValue, 
                            count: item.count,
                            isSelected 
                          });
                          
                          return (
                            <CommandItem
                              key={itemValue}
                              value={itemValue}
                              onSelect={(value) => {
                                console.log('Item selected:', { column, value });
                                handleFilterChange(column, value);
                                setOpenPopover(null);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  isSelected ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {itemValue || 'NULL'}
                              <span className="ml-auto text-xs text-muted-foreground">
                                ({item.count})
                              </span>
                            </CommandItem>
                          );
                        })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {activeFilters.some(f => f.column === column) && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => clearFilter(column)}
                >
                  {column}: {activeFilters.find(f => f.column === column)?.value}
                  <span className="ml-1">×</span>
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {activeFilters.length > 0 && (
        <div className="pt-2">
          <Separator className="my-2" />
          <div className="text-sm text-muted-foreground">
            Active filters: {activeFilters.length}
          </div>
        </div>
      )}
    </div>
  );
} 