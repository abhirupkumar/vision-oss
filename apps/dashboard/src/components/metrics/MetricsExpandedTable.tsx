'use client';
import { type ReactNode, useEffect, useState } from 'react';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { Pagination } from '@/components/common/Pagination';
import { useMessages, useProjectExpandedMetricsQuery } from '@/components/hooks';
import { X } from '@/components/icons';
import { DownloadButton } from '@/components/input/DownloadButton';
import { MetricLabel } from '@/components/metrics/MetricLabel';
import { cn } from '@/lib/cn';
import { SESSION_COLUMNS } from '@/lib/constants';
import { formatShortTime } from '@/lib/format';

export interface MetricsExpandedTableProps {
  projectId: string;
  type?: string;
  title?: string;
  dataFilter?: (data: any) => any;
  onSearch?: (search: string) => void;
  params?: { [key: string]: any };
  allowSearch?: boolean;
  allowDownload?: boolean;
  renderLabel?: (row: any, index: number) => ReactNode;
  onClose?: () => void;
  children?: ReactNode;
}

export function MetricsExpandedTable({
  projectId,
  type,
  title,
  params,
  allowSearch = true,
  allowDownload = true,
  onClose,
  children,
}: MetricsExpandedTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { formatMessage, labels } = useMessages();
  const isType = ['browser', 'country', 'device', 'os'].includes(type);
  const showBounceDuration = SESSION_COLUMNS.includes(type);

  useEffect(() => {
    setPage(1);
  }, [type, search]);

  const { data, isLoading, isFetching, error } = useProjectExpandedMetricsQuery(projectId, {
    type,
    search: isType ? undefined : search,
    ...params,
  });

  const items = data?.map(({ name, ...props }) => ({ label: name, ...props }));
  const pageSize = 25;
  const totalItems = items?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const displayedItems = items?.slice((page - 1) * pageSize, page * pageSize) || [];

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center gap-2 pb-3">
        {allowSearch && (
          <input
            type="search"
            className={cn(
              'rounded-md border border-input bg-background px-3 py-1.5 text-sm',
              'text-foreground placeholder:text-muted-foreground',
              'outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
              'w-full max-w-xs',
            )}
            placeholder={formatMessage(labels.search)}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        )}
        <div className="flex flex-1 items-center justify-end gap-2">
          {children}
          {allowDownload && <DownloadButton filename={type} data={data} />}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <span className="h-4 w-4">
                <X />
              </span>
            </button>
          )}
        </div>
      </div>

      <LoadingPanel
        data={data}
        isFetching={isFetching}
        isLoading={isLoading}
        error={error}
        minHeight="400px"
      >
        <div className="h-full min-h-0 overflow-auto pr-3">
          {items && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th
                    className="py-2 pr-4 text-left text-xs font-semibold text-muted-foreground"
                    style={{ minWidth: '200px' }}
                  >
                    {title}
                  </th>
                  <th className="py-2 pr-4 text-right text-xs font-semibold text-muted-foreground w-28">
                    {formatMessage(labels.visitors)}
                  </th>
                  <th className="py-2 pr-4 text-right text-xs font-semibold text-muted-foreground w-28">
                    {formatMessage(labels.visits)}
                  </th>
                  <th className="py-2 pr-4 text-right text-xs font-semibold text-muted-foreground w-28">
                    {formatMessage(labels.views)}
                  </th>
                  {showBounceDuration && (
                    <>
                      <th className="py-2 pr-4 text-right text-xs font-semibold text-muted-foreground w-28">
                        {formatMessage(labels.bounceRate)}
                      </th>
                      <th className="py-2 pr-4 text-right text-xs font-semibold text-muted-foreground w-28">
                        {formatMessage(labels.visitDuration)}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayedItems.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <td className="py-2 pr-4 overflow-hidden">
                      <div className="overflow-hidden">
                        <MetricLabel type={type} data={row} />
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {row?.visitors?.toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {row?.visits?.toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {row?.pageviews?.toLocaleString()}
                    </td>
                    {showBounceDuration && (
                      <>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {`${Math.round((Math.min(row?.visits, row?.bounces) / row?.visits) * 100)}%`}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {formatShortTime(
                            Math.abs(~~(row?.totaltime / row?.visits)),
                            ['m', 's'],
                            ' ',
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {totalItems > pageSize && (
          <div className="flex items-center justify-between px-2 pt-3 text-xs text-muted-foreground border-t border-border mt-auto">
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems.toLocaleString()} items
            </span>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </LoadingPanel>
    </>
  );
}
