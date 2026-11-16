'use client';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useMessages } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CURRENCIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function CurrencySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const { formatMessage, labels } = useMessages();

  const selectedCurrency = CURRENCIES.find(c => c.id === value);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {formatMessage(labels.currency)}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal hover:bg-muted/50 h-10 border-input/50"
          >
            {selectedCurrency ? (
              <span className="flex items-center gap-2 overflow-hidden">
                <span className="font-bold text-foreground">{selectedCurrency.id}</span>
                <span className="text-muted-foreground/50">—</span>
                <span className="truncate text-muted-foreground">{selectedCurrency.name}</span>
              </span>
            ) : (
              'Select currency...'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search currency..." className="h-9" />
            <CommandList>
              <CommandEmpty>No currency found.</CommandEmpty>
              <CommandGroup>
                {CURRENCIES.map(currency => (
                  <CommandItem
                    key={currency.id}
                    value={`${currency.id} ${currency.name}`}
                    onSelect={() => {
                      onChange?.(currency.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === currency.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="font-bold min-w-[40px]">{currency.id}</span>
                    <span className="text-muted-foreground/50">—</span>
                    <span className="truncate text-muted-foreground">{currency.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
