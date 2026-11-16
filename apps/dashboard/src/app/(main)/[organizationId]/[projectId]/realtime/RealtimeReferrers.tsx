
import { useMessages, useProject } from '@/components/hooks';
import { ListTable } from '@/components/metrics/ListTable';
import { percentFilter } from '@/lib/filters';

export function RealtimeReferrers({ data }: { data: any }) {
  const project = useProject();
  const { formatMessage, labels } = useMessages();
  const { referrers } = data || {};
  const limit = 15;

  const renderLink = ({ label: x }) => {
    const domain = x.startsWith('/') ? project?.domain : '';
    return (
      <a href={`//${domain}${x}`} target="_blank" rel="noreferrer noopener">
        {x}
      </a>
    );
  };

  const domains = percentFilter(
    Object.keys(referrers)
      .map(key => {
        return {
          x: key,
          y: referrers[key],
        };
      })
      .sort((a, b) => b.y - a.y)
      .slice(0, limit),
  );

  return (
    <ListTable
      title={formatMessage(labels.referrers)}
      metric={formatMessage(labels.views)}
      renderLabel={renderLink}
      data={domains.map(({ x, y, z }: { x: string; y: number; z: number }) => ({
        label: x,
        count: y,
        percent: z,
      }))}
    />
  );
}
