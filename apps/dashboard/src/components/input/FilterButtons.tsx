import { useState } from 'react';
import { cn } from '@/lib/cn';

export interface FilterButtonsProps {
  items: { id: string; label: string }[];
  value: string;
  onChange?: (value: string) => void;
}

export function FilterButtons({ items, value, onChange }: FilterButtonsProps) {
  const [selected, setSelected] = useState(value);

  const handleChange = (value: string) => {
    setSelected(value);
    onChange?.(value);
  };

  return (
    <div className="flex items-center rounded-md border border-border p-0.5 bg-muted">
      {items.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => handleChange(id)}
          className={cn(
            'rounded px-3 py-1 text-sm font-medium transition-all',
            selected === id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
