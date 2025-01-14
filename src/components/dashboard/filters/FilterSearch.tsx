import { CommandInput } from '@/components/ui/command';

interface FilterSearchProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function FilterSearch({ placeholder, value, onChange }: FilterSearchProps) {
  return (
    <CommandInput 
      placeholder={placeholder}
      value={value}
      onValueChange={onChange}
    />
  );
} 