import { type ReactNode, useState } from 'react';
import { DataGrid } from '@/components/common/DataGrid';
import { useMessages, useProjectEventsQuery } from '@/components/hooks';
import { FilterButtons } from '@/components/input/FilterButtons';
import { EventsTable } from './EventsTable';

export function EventsDataTable({
  projectId,
  visitorId,
  startAt,
  endAt,
}: {
  projectId?: string;
  organizationId?: string;
  visitorId?: string;
  startAt?: number;
  endAt?: number;
  children?: ReactNode;
}) {
  const { formatMessage, labels } = useMessages();
  const [view, setView] = useState('all');

  const params: any = { view, visitorId };
  if (startAt !== undefined) params.startAt = startAt;
  if (endAt !== undefined) params.endAt = endAt;

  const query = useProjectEventsQuery(projectId, params);

  const buttons = [
    {
      id: 'all',
      label: formatMessage(labels.all),
    },
    {
      id: 'views',
      label: formatMessage(labels.views),
    },
    {
      id: 'events',
      label: formatMessage(labels.events),
    },
  ];

  const renderActions = () => {
    return <FilterButtons items={buttons} value={view} onChange={setView} />;
  };

  return (
    <DataGrid
      query={query}
      allowSearch={true}
      autoFocus={false}
      allowPaging={true}
      renderActions={renderActions}
    >
      {({ data }) => <EventsTable data={data} />}
    </DataGrid>
  );
}
