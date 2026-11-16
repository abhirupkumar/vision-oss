import { useState } from 'react';
import { DateDisplay } from '@/components/common/DateDisplay';
import { useDateRange, useMessages, useNavigation } from '@/components/hooks';
import { ChangeLabel } from '@/components/metrics/ChangeLabel';
import { MetricsTable } from '@/components/metrics/MetricsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatNumber } from '@/lib/format';

export function CompareTables({ projectId }: { projectId: string }) {
  const [data, setData] = useState([]);
  const { dateRange, dateCompare } = useDateRange();
  const { formatMessage, labels } = useMessages();
  const {
    router,
    updateParams,
    query: { view = 'path' },
  } = useNavigation();
  const { startDate, endDate } = dateCompare;

  const params = {
    startAt: startDate.getTime(),
    endAt: endDate.getTime(),
  };

  const renderPath = (view: string) => {
    return updateParams({ view });
  };

  const items = [
    { id: 'path', label: formatMessage(labels.path) },
    { id: 'channel', label: formatMessage(labels.channels) },
    { id: 'referrer', label: formatMessage(labels.referrers) },
    { id: 'browser', label: formatMessage(labels.browsers) },
    { id: 'os', label: formatMessage(labels.os) },
    { id: 'device', label: formatMessage(labels.devices) },
    { id: 'country', label: formatMessage(labels.countries) },
    { id: 'region', label: formatMessage(labels.regions) },
    { id: 'city', label: formatMessage(labels.cities) },
    { id: 'language', label: formatMessage(labels.languages) },
    { id: 'screen', label: formatMessage(labels.screens) },
    { id: 'event', label: formatMessage(labels.events) },
    { id: 'hostname', label: formatMessage(labels.hostname) },
    { id: 'tag', label: formatMessage(labels.tags) },
  ];

  const renderChange = ({ label, count }) => {
    const prev = data.find(d => d.x === label)?.y;
    if (prev === undefined || prev === 0) return null;

    const value = count - prev;
    const change = Math.abs(((count - prev) / prev) * 100);

    return (
      !Number.isNaN(change) && (
        <ChangeLabel className="mx-2" value={value} size="xs">
          {formatNumber(change)}%
        </ChangeLabel>
      )
    );
  };

  const handleChange = (id: string) => {
    router.push(renderPath(id));
  };

  return (
    <div className="flex flex-col gap-6 mt-10">
      <div className="flex flex-col gap-2 w-full max-w-[300px]">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
          {formatMessage(labels.compare)}
        </Label>
        <Select value={view as string} onValueChange={handleChange}>
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder={formatMessage(labels.select)} />
          </SelectTrigger>
          <SelectContent>
            {items.map(({ id, label }) => (
              <SelectItem key={id} value={id}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Previous Period */}
        <Card className="border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
              {formatMessage(labels.previous)}
            </CardTitle>
            <DateDisplay startDate={startDate} endDate={endDate} />
          </CardHeader>
          <CardContent className="px-2">
            <MetricsTable
              projectId={projectId}
              type={view as string}
              limit={20}
              showMore={false}
              params={params}
              onDataLoad={setData}
            />
          </CardContent>
        </Card>

        {/* Current Period */}
        <Card className="border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
              {formatMessage(labels.current)}
            </CardTitle>
            <DateDisplay startDate={dateRange.startDate} endDate={dateRange.endDate} />
          </CardHeader>
          <CardContent className="px-2">
            <MetricsTable
              projectId={projectId}
              type={view as string}
              limit={20}
              showMore={false}
              renderChange={renderChange}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
