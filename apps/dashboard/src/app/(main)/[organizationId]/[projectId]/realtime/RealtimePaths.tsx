
import { useMessages, useProject } from '@/components/hooks';
import { ListTable } from '@/components/metrics/ListTable';
import { percentFilter } from '@/lib/filters';

export function RealtimePaths({ data }: { data: any }) {
  const project = useProject();
  const { formatMessage, labels } = useMessages();
  const { urls } = data || {};
  const limit = 15;

  const renderLink = ({ label: x }) => {
    const domain = x.startsWith('/') ? project?.domain : '';
    return (
      <a href={`//${domain}${x}`} target="_blank" rel="noreferrer noopener">
        {x}
      </a>
    );
  };

  const pages = percentFilter(
    Object.keys(urls)
      .map(key => {
        return {
          x: key,
          y: urls[key],
        };
      })
      .sort((a, b) => b.y - a.y)
      .slice(0, limit),
  );

  return (
    <ListTable
      title={formatMessage(labels.pages)}
      metric={formatMessage(labels.views)}
      renderLabel={renderLink}
      data={pages.map(({ x, y, z }: { x: string; y: number; z: number }) => ({
        label: x,
        count: y,
        percent: z,
      }))}
    />
  );
}
