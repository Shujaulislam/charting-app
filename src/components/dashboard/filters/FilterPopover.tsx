import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterSearch } from './FilterSearch';
import { DistinctValue } from './types';

interface FilterPopoverProps {
  column: string;
  values: readonly DistinctValue[];
  isLoading: boolean;
  onSelect: (value: string) => void;
  currentValue?: string;
}

export function FilterPopover({
  column,
  values,
  isLoading,
  onSelect,
  currentValue,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredValues = searchValue
    ? values.filter(item =>
        item.value?.toString().toLowerCase().includes(searchValue.toLowerCase())
      )
    : values;

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      if (isOpen) {
        setSearchValue('');
      }
      setOpen(isOpen);
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-[250px]"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <span>{currentValue ? `${column}: ${currentValue}` : column}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <FilterSearch
            placeholder={`Search ${column} values...`}
            value={searchValue}
            onChange={setSearchValue}
          />
          <CommandEmpty>No values found.</CommandEmpty>
          <CommandGroup>
            {filteredValues.map((item) => {
              const itemValue = item.value?.toString() ?? 'NULL';
              const isSelected = currentValue === itemValue;
              
              return (
                <CommandItem
                  key={itemValue}
                  value={itemValue}
                  onSelect={() => {
                    onSelect(itemValue);
                    setOpen(false);
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
  );
} 