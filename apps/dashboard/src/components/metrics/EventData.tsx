import { LoadingPanel } from '@/components/common/LoadingPanel';
import { useEventDataQuery } from '@/components/hooks';

export function EventData({ projectId, eventId }: { projectId: string; eventId: string }) {
  const { data, isLoading, error } = useEventDataQuery(projectId, eventId);

  return (
    <LoadingPanel isLoading={isLoading} error={error}>
      <div className="grid grid-cols-2 gap-5">
        {data?.map(({ dataKey, stringValue }) => {
          return (
            <div key={dataKey} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">{dataKey}</label>
              <p className="text-sm text-foreground">{stringValue}</p>
            </div>
          );
        })}
      </div>
    </LoadingPanel>
  );
}
