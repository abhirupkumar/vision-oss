import { Empty } from '@/components/common/Empty';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { useSessionDataQuery } from '@/components/hooks';
import { DATA_TYPES } from '@/lib/constants';

export function SessionData({ projectId, sessionId }: { projectId: string; sessionId: string }) {
  const { data, isLoading, error } = useSessionDataQuery(projectId, sessionId);

  return (
    <LoadingPanel data={data} isLoading={isLoading} error={error}>
      {!data?.length && <Empty />}
      <div className="flex flex-col gap-6">
        {data?.map(({ dataKey, dataType, stringValue }) => {
          return (
            <div key={dataKey} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {dataKey}
              </span>
              <div className="flex flex-row items-center gap-2">
                <span className="text-sm font-medium text-foreground">{stringValue}</span>
                <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                  {DATA_TYPES[dataType]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </LoadingPanel>
  );
}
