import { useEffect, useMemo } from 'react';
import { LinkButton } from '@/components/common/LinkButton';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import {
  useMessages,
  useNavigation,
  useProjectMetricsBatchQuery,
  useProjectMetricsQuery,
} from '@/components/hooks';
import { Maximize } from '@/components/icons';
import { MetricLabel } from '@/components/metrics/MetricLabel';
import { percentFilter } from '@/lib/filters';
import { ListTable, type ListTableProps } from './ListTable';

export interface MetricsTableProps extends ListTableProps {
  projectId: string;
  type: string;
  dataFilter?: (data: any) => any;
  limit?: number;
  showMore?: boolean;
  filterLink?: boolean;
  params?: Record<string, any>;
  onDataLoad?: (data: any) => void;
  useBatch?: boolean;
  batchTypes?: string[];
}

export function MetricsTable({
  projectId,
  type,
  dataFilter,
  limit,
  showMore = false,
  filterLink = true,
  params,
  onDataLoad,
  useBatch = false,
  batchTypes = [],
  ...props
}: MetricsTableProps) {
  const { updateParams } = useNavigation();
  const { formatMessage, labels } = useMessages();

  const {
    data: singleData,
    isLoading: isSingleLoading,
    isFetching: isSingleFetching,
    error: singleError,
  } = useProjectMetricsQuery(projectId, { type, limit, ...params }, { enabled: !useBatch });

  const {
    data: batchData,
    isLoading: isBatchLoading,
    isFetching: isBatchFetching,
    error: batchError,
  } = useProjectMetricsBatchQuery(projectId, { types: batchTypes, limit, ...params }, {
    enabled: useBatch,
    select: (data: any) => data?.[type] || [],
  } as any);

  const data = useBatch ? (batchData as any as any[]) : singleData;
  const isLoading = useBatch ? isBatchLoading : isSingleLoading;
  const isFetching = useBatch ? isBatchFetching : isSingleFetching;
  const error = useBatch ? batchError : singleError;

  const filteredData = useMemo(() => {
    if (data) {
      let items = data as any[];

      if (dataFilter) {
        if (Array.isArray(dataFilter)) {
          items = dataFilter.reduce((arr, filter) => {
            return filter(arr);
          }, items);
        } else {
          items = dataFilter(items);
        }
      }

      items = percentFilter(items);

      return items.map(({ x, y, z, ...props }) => ({ label: x, count: y, percent: z, ...props }));
    }
    return [];
  }, [data, dataFilter, limit, type]);

  useEffect(() => {
    if (data) {
      onDataLoad?.(data);
    }
  }, [data]);

  const renderLabel = (row: any) => {
    return filterLink ? <MetricLabel type={type} data={row} /> : row.label;
  };

  return (
    <LoadingPanel
      data={data}
      isFetching={isFetching}
      isLoading={isLoading}
      error={error}
      minHeight="400px"
    >
      <div className="flex flex-col gap-2">
        {data && <ListTable {...props} data={filteredData} renderLabel={renderLabel} />}
        {showMore && limit && (
          <div className="flex items-end justify-center">
            <LinkButton href={updateParams({ view: type })} variant="ghost">
              <span className="h-4 w-4 shrink-0">
                <Maximize />
              </span>
              <span>{formatMessage(labels.more)}</span>
            </LinkButton>
          </div>
        )}
      </div>
    </LoadingPanel>
  );
}
