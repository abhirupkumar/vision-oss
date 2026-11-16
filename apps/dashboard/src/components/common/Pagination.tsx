'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  const delta = 2;
  let prev = -1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      if (prev !== -1 && i - prev > 1) pages.push('...');
      pages.push(i);
      prev = i;
    }
  }

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0 text-xs"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
