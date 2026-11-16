import { Empty } from '@/components/common/Empty';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { useProjectSegmentsQuery } from '@/components/hooks';
import { ChartPie, UserPlus } from '@/components/icons';
import { cn } from '@/lib/cn';

export interface SegmentFiltersProps {
  projectId: string;
  segmentId: string;
  type?: string;
  onChange?: (id: string, type: string) => void;
}

export function SegmentFilters({
  projectId,
  segmentId,
  type = 'segment',
  onChange,
}: SegmentFiltersProps) {
  const { data, isLoading, isFetching } = useProjectSegmentsQuery(projectId, { type });

  const handleChange = (id: string) => {
    onChange?.(id, type);
  };

  return (
    <LoadingPanel data={data} isLoading={isLoading} isFetching={isFetching}>
      {data?.data?.length === 0 && <Empty />}
      <div className="flex flex-col gap-0.5 overflow-y-auto">
        {data?.data?.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleChange(item.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors',
              segmentId === item.id
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-foreground hover:bg-accent/50',
            )}
          >
            <span className="h-4 w-4 shrink-0 text-muted-foreground">
              {type === 'segment' ? <ChartPie /> : <UserPlus />}
            </span>
            {item.name}
          </button>
        ))}
      </div>
    </LoadingPanel>
  );
}
