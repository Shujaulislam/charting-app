import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FilterBadge } from './FilterBadge';
import { ColumnFilter } from './types';

interface FilterListProps {
  filters: readonly ColumnFilter[];
  onRemove: (column: string) => void;
  onClearAll: () => void;
}

export function FilterList({ filters, onRemove, onClearAll }: FilterListProps) {
  if (!filters.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Active Filters</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
        >
          Clear all filters
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <FilterBadge
            key={`${filter.column}-${filter.value}`}
            column={filter.column}
            value={filter.value}
            onRemove={() => onRemove(filter.column)}
          />
        ))}
      </div>
    </div>
  );
} 