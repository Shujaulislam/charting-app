// Commenting out entire ColumnFilters component temporarily
// TODO: Filter columns functionality to be re-implemented later
/*
import React from 'react';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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

// Strict type definitions
interface ColumnFilter {
  readonly column: string;
  readonly value: string;
}

interface DistinctValue {
  readonly value: string | number | null;
  readonly count: number;
}

interface ColumnFiltersProps {
  readonly table: string;
  readonly columns: readonly string[];
  onFiltersChange: (filters: readonly ColumnFilter[]) => void;
}

interface FetchResult {
  readonly values?: readonly DistinctValue[];
  readonly isIdColumn?: boolean;
  readonly error?: string;
}

type LoadingState = Readonly<Record<string, boolean>>;
type DistinctValuesState = Readonly<Record<string, readonly DistinctValue[]>>;

// Add utility for fetch with timeout
const fetchWithTimeout = async (url: string, signal: AbortSignal, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { 
      signal: AbortSignal.any([signal, controller.signal])
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const ColumnFilters = ({ table, columns, onFiltersChange }: ColumnFiltersProps) => {
  // Use refs for stable identities
  const tableRef = useRef(table);
  const columnsRef = useRef(columns);

  // State with proper readonly types
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [distinctValues, setDistinctValues] = useState<DistinctValuesState>({});
  const [excludedColumns, setExcludedColumns] = useState<readonly string[]>([]);
  const [activeFilters, setActiveFilters] = useState<readonly ColumnFilter[]>([]);
  const [loading, setLoading] = useState<LoadingState>({});
  const [searchValue, setSearchValue] = useState('');
  const { toast } = useToast();

  // Update refs when props change
  useEffect(() => {
    tableRef.current = table;
    columnsRef.current = columns;
  }, [table, columns]);

  // Create stable filter key
  const filterKey = useMemo(() => 
    activeFilters.map(f => `${f.column}:${f.value}`).join('|'),
    [activeFilters]
  );

  // Cleanup on table change
  useEffect(() => {
    return () => {
      setDistinctValues({});
      setActiveFilters([]);
      setSearchValue('');
    };
  }, [table]);

  // Update fetch function to use timeout
  const fetchDistinctValuesForColumn = useCallback(async (
    column: string,
    signal: AbortSignal
  ): Promise<FetchResult> => {
    const retryCount = 2; // Number of retries for transient failures
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const url = `/api/distinct-values?table=${encodeURIComponent(tableRef.current)}&column=${encodeURIComponent(column)}`;
        
        // Add delay for retries
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const response = await fetchWithTimeout(url, signal);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.isIdColumn) {
          return { isIdColumn: true };
        }

        if (!Array.isArray(data.values)) {
          throw new Error('Invalid data format received');
        }

        return { values: Object.freeze(data.values) };
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            return { error: 'cancelled' };
          }
          lastError = error;
          // Only retry on network errors or 5xx server errors
          if (!error.name.includes('Network') && !(error.message.includes('status: 5'))) {
            throw error;
          }
        }
        // If this was our last attempt, throw the error
        if (attempt === retryCount) {
          throw lastError || new Error('Failed to fetch values');
        }
      }
    }

    return { error: 'Failed to fetch values after retries' };
  }, []); // Empty deps since we use ref

  // Update the fetch effect to use the stable filter key
  useEffect(() => {
    if (!tableRef.current || !columnsRef.current.length) return;

    const abortController = new AbortController();
    
    setLoading(Object.freeze(
      Object.fromEntries(columnsRef.current.map(col => [col, true]))
    ));

    const stableColumns = Object.freeze([...columnsRef.current]);
    
    Promise.all(
      stableColumns.map(column => 
        fetchDistinctValuesForColumn(column, abortController.signal)
      )
    ).then(results => {
      if (abortController.signal.aborted) return;

      const newValues: Record<string, readonly DistinctValue[]> = {};
      const newExcluded: string[] = [];

      results.forEach((result, index) => {
        const column = stableColumns[index];
        if (result.isIdColumn) {
          newExcluded.push(column);
          toast({
            title: "Column Excluded",
            description: `${column} was excluded from filtering as it contains mostly unique values.`,
          });
        } else if (result.values) {
          newValues[column] = result.values;
        } else if (result.error && result.error !== 'cancelled') {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to fetch values for ${column}: ${result.error}`,
          });
        }
      });

      setDistinctValues(Object.freeze(newValues));
      setExcludedColumns(Object.freeze(newExcluded));
      setLoading(Object.freeze({}));
    }).catch(error => {
      if (!abortController.signal.aborted) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch column values",
        });
        setLoading(Object.freeze({}));
      }
    });

    return () => {
      abortController.abort();
    };
  }, [table, columns, fetchDistinctValuesForColumn, toast, filterKey]); // Add filterKey to deps

  // Memoized derived values
  const filterableColumns = useMemo(() => 
    Object.freeze(columns.filter(col => !excludedColumns.includes(col))),
    [columns, excludedColumns]
  );

  const getFilteredValues = useCallback((columnValues: readonly DistinctValue[]) => {
    if (!searchValue) return columnValues;
    const searchLower = searchValue.toLowerCase();
    return Object.freeze(
      columnValues.filter(item => 
        item.value?.toString().toLowerCase().includes(searchLower)
      )
    );
  }, [searchValue]);

  // Atomic state updates
  const handleFilterChange = useCallback((column: string, value: string | null) => {
    setActiveFilters(prev => {
      const newFilters = prev.filter(f => f.column !== column);
      if (value) {
        return Object.freeze([...newFilters, { column, value }]);
      }
      return Object.freeze(newFilters);
    });
  }, []);

  // Debounced filter apply
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange(activeFilters);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [activeFilters, onFiltersChange]);

  if (!table || !filterableColumns.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Filter Columns</Label>
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveFilters(Object.freeze([]));
              onFiltersChange([]);
            }}
          >
            Clear all filters
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {filterableColumns.map((column) => {
          const values = distinctValues[column] || [];
          const currentFilter = activeFilters.find(f => f.column === column);
          const filteredValues = getFilteredValues(values);
          
          return (
            <div key={column} className="flex items-center space-x-2">
              <Popover 
                open={openPopover === column} 
                onOpenChange={(open) => {
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
                        <span>{currentFilter ? `${column}: ${currentFilter.value}` : column}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder={`Search ${column} values...`} 
                      value={searchValue}
                      onValueChange={setSearchValue}
                    />
                    <CommandEmpty>No values found.</CommandEmpty>
                    <CommandGroup>
                      {filteredValues.map((item) => {
                        const itemValue = item.value?.toString() ?? 'NULL';
                        const isSelected = currentFilter?.value === itemValue;
                        
                        return (
                          <CommandItem
                            key={itemValue}
                            value={itemValue}
                            onSelect={() => {
                              handleFilterChange(column, itemValue);
                              setOpenPopover(null);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                isSelected ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {itemValue} ({item.count})
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {currentFilter && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleFilterChange(column, null)}
                >
                  {column}: {currentFilter.value}
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
};

export default ColumnFilters;
*/ 