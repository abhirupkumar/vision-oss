'use client';
import type { UseQueryResult } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import { Empty } from '@/components/common/Empty';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { Pager } from '@/components/common/Pager';
import { useMessages, useMobile, useNavigation } from '@/components/hooks';
import { cn } from '@/lib/cn';
import type { PageResult } from '@/lib/types';

const DEFAULT_SEARCH_DELAY = 600;

export interface DataGridProps {
  query: UseQueryResult<PageResult<any>, any>;
  searchDelay?: number;
  allowSearch?: boolean;
  allowPaging?: boolean;
  autoFocus?: boolean;
  renderActions?: () => ReactNode;
  renderEmpty?: () => ReactNode;
  children: ReactNode | ((data: any) => ReactNode);
}

export function DataGrid({
  query,
  searchDelay = 600,
  allowSearch,
  allowPaging = true,
  autoFocus,
  renderActions,
  renderEmpty = () => <Empty />,
  children,
}: DataGridProps) {
  const { formatMessage, labels } = useMessages();
  const { data, error, isLoading, isFetching } = query;
  const { router, updateParams, query: queryParams } = useNavigation();
  const [search, setSearch] = useState(queryParams?.search || data?.search || '');
  const showPager = allowPaging && data && data.count > data.pageSize;
  const { isMobile } = useMobile();
  const displayMode = isMobile ? 'cards' : undefined;

  let searchTimer: ReturnType<typeof setTimeout>;

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (value !== (queryParams?.search || '')) {
        router.push(updateParams({ search: value, page: 1 }));
      }
    }, searchDelay || DEFAULT_SEARCH_DELAY);
  };

  const handlePageChange = useCallback(
    (page: number) => {
      router.push(updateParams({ search, page }));
    },
    [search],
  );

  const child = data ? (typeof children === 'function' ? children(data) : children) : null;

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: '300px' }}>
      {allowSearch && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              autoFocus={autoFocus}
              placeholder={formatMessage(labels.search)}
              className={cn(
                'w-full max-w-sm rounded-md border border-input bg-background py-1.5 pl-9 pr-3 text-sm',
                'text-foreground placeholder:text-muted-foreground',
                'outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
              )}
            />
          </div>
          {renderActions?.()}
        </div>
      )}

      <LoadingPanel
        data={data}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        renderEmpty={renderEmpty}
      >
        {data && (
          <>
            <div>
              {isValidElement(child)
                ? cloneElement(child as ReactElement<any>, { displayMode })
                : child}
            </div>
            {showPager && (
              <div className="mt-6">
                <Pager
                  page={data.page}
                  pageSize={data.pageSize}
                  count={data.count}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </LoadingPanel>
    </div>
  );
}
