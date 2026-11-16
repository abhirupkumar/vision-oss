'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMessages } from '@/components/hooks';
import { Button } from '@/components/ui/button';

export interface PagerProps {
  page: string | number;
  pageSize: string | number;
  count: string | number;
  onPageChange: (nextPage: number) => void;
  className?: string;
}

export function Pager({ page, pageSize, count, onPageChange }: PagerProps) {
  const { formatMessage, labels } = useMessages();
  const maxPage = pageSize && count ? Math.ceil(+count / +pageSize) : 0;
  const lastPage = +page === maxPage;
  const firstPage = +page === 1;

  if (count === 0 || !maxPage) {
    return null;
  }

  const handlePageChange = (value: number) => {
    const nextPage = +page + +value;

    if (nextPage > 0 && nextPage <= maxPage) {
      onPageChange(nextPage);
    }
  };

  if (maxPage === 1) {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-between gap-3 flex-wrap">
      <div className="text-sm text-muted-foreground">
        {formatMessage(labels.numberOfRecords, { x: count.toLocaleString() })}
      </div>
      <div className="flex items-center justify-end gap-4 ml-auto">
        <div className="text-sm font-medium text-foreground">
          {formatMessage(labels.pageOf, {
            current: page.toLocaleString(),
            total: maxPage.toLocaleString(),
          })}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(-1)}
            disabled={firstPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(1)}
            disabled={lastPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
