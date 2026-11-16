import { useEffect, useMemo, useState } from 'react';
import { PieChart } from '@/components/charts/PieChart';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import {
  useEventDataPropertiesQuery,
  useEventDataValuesQuery,
  useMessages,
} from '@/components/hooks';
import { ListTable } from '@/components/metrics/ListTable';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CHART_COLORS } from '@/lib/constants';

export function EventProperties({ projectId }: { projectId: string }) {
  const [propertyName, setPropertyName] = useState('');
  const [eventName, setEventName] = useState('');

  const { formatMessage, labels, messages } = useMessages();
  const { data, isLoading, isFetching, error } = useEventDataPropertiesQuery(projectId);

  const events: string[] = data
    ? data.reduce((arr: string[], e: { eventName: string }) => {
        return !arr.includes(e.eventName) ? arr.concat(e.eventName) : arr;
      }, [])
    : [];

  const properties: string[] = eventName
    ? data?.filter(e => e.eventName === eventName).map(e => e.propertyName)
    : [];

  useEffect(() => {
    if (!eventName && events.length > 0) {
      setEventName(events[0]);
    }
  }, [events, eventName]);

  useEffect(() => {
    if (eventName && !propertyName && properties.length > 0) {
      setPropertyName(properties[0]);
    }
  }, [eventName, properties, propertyName]);

  const handleEventChange = (value: string) => {
    setEventName(value);
    setPropertyName('');
  };

  return (
    <LoadingPanel
      data={data}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      minHeight="300px"
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex flex-col gap-2 min-w-[240px]">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
              {formatMessage(labels.event)}
            </Label>
            <Select value={eventName} onValueChange={handleEventChange}>
              <SelectTrigger className="w-full bg-card">
                <SelectValue placeholder={formatMessage(labels.select)} />
              </SelectTrigger>
              <SelectContent>
                {events?.map(p => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 min-w-[240px]">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
              {formatMessage(labels.property)}
            </Label>
            <Select value={propertyName} onValueChange={setPropertyName} disabled={!eventName}>
              <SelectTrigger className="w-full bg-card">
                <SelectValue placeholder={formatMessage(labels.select)} />
              </SelectTrigger>
              <SelectContent>
                {properties?.map(p => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {eventName && propertyName ? (
          <EventValues projectId={projectId} eventName={eventName} propertyName={propertyName} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border rounded-lg border-dashed bg-muted/20">
            <p className="text-sm text-muted-foreground">
              {formatMessage(messages.nothingSelected)}
            </p>
          </div>
        )}
      </div>
    </LoadingPanel>
  );
}

const EventValues = ({ projectId, eventName, propertyName }) => {
  const { formatMessage, labels } = useMessages();
  const {
    data: values,
    isLoading,
    isFetching,
    error,
  } = useEventDataValuesQuery(projectId, eventName, propertyName);

  const propertySum = useMemo(() => {
    return values?.reduce((sum, { total }) => sum + total, 0) ?? 0;
  }, [values]);

  const chartData = useMemo(() => {
    if (!propertyName || !values) return null;
    return {
      labels: values.map(({ value }) => value),
      datasets: [
        {
          data: values.map(({ total }) => total),
          backgroundColor: CHART_COLORS,
          borderWidth: 0,
        },
      ],
    };
  }, [propertyName, values]);

  const tableData = useMemo(() => {
    if (!propertyName || !values || propertySum === 0) return [];
    return values.map(({ value, total }) => ({
      label: value,
      count: total,
      percent: 100 * (total / propertySum),
    }));
  }, [propertyName, values, propertySum]);

  return (
    <LoadingPanel
      isLoading={isLoading}
      isFetching={isFetching}
      data={values}
      error={error}
      minHeight="300px"
    >
      {values && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-lg border bg-card p-2">
            <ListTable title={propertyName} metric={formatMessage(labels.count)} data={tableData} />
          </div>

          <Card className="flex items-center justify-center border bg-card p-8 min-h-[400px]">
            <div className="w-full max-w-[320px] aspect-square">
              <PieChart type="doughnut" chartData={chartData} />
            </div>
          </Card>
        </div>
      )}
    </LoadingPanel>
  );
};
