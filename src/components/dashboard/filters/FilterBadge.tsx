import { Badge } from '@/components/ui/badge';

interface FilterBadgeProps {
  column: string;
  value: string;
  onRemove: () => void;
}

export function FilterBadge({ column, value, onRemove }: FilterBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className="cursor-pointer"
      onClick={onRemove}
    >
      {column}: {value}
      <span className="ml-1">×</span>
    </Badge>
  );
} 