import type { ReactNode } from 'react';
import { DateDistance } from '@/components/common/DateDistance';
import { TypeIcon } from '@/components/common/TypeIcon';
import { useFormat, useLocale, useMessages, useRegionNames } from '@/components/hooks';
import { Calendar, KeyRound, Landmark, MapPin } from '@/components/icons';

export function SessionInfo({ data }) {
  const { locale } = useLocale();
  const { formatMessage, labels } = useMessages();
  const { formatValue } = useFormat();
  const { getRegionName } = useRegionNames(locale);

  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
      <Info label={formatMessage(labels.distinctId)} icon={<KeyRound />}>
        <span className="font-mono text-xs">{data?.distinctId}</span>
      </Info>

      <Info label={formatMessage(labels.lastSeen)} icon={<Calendar />}>
        <DateDistance date={new Date(data.lastAt)} />
      </Info>

      <Info label={formatMessage(labels.firstSeen)} icon={<Calendar />}>
        <DateDistance date={new Date(data.firstAt)} />
      </Info>

      <Info
        label={formatMessage(labels.country)}
        icon={<TypeIcon type="country" value={data?.country} />}
      >
        {formatValue(data?.country, 'country')}
      </Info>

      <Info label={formatMessage(labels.region)} icon={<MapPin />}>
        {getRegionName(data?.region, data?.country, false)}
      </Info>

      <Info label={formatMessage(labels.city)} icon={<Landmark />}>
        {data?.city}
      </Info>

      <Info
        label={formatMessage(labels.browser)}
        icon={<TypeIcon type="browser" value={data?.browser} />}
      >
        {formatValue(data?.browser, 'browser')}
      </Info>

      <Info
        label={formatMessage(labels.os)}
        icon={<TypeIcon type="os" value={data?.os?.toLowerCase()?.replaceAll(/\W/g, '-')} />}
      >
        {formatValue(data?.os, 'os')}
      </Info>

      <Info
        label={formatMessage(labels.device)}
        icon={<TypeIcon type="device" value={data?.device} />}
      >
        {formatValue(data?.device, 'device')}
      </Info>
    </div>
  );
}

const Info = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="flex flex-row items-center gap-2 text-sm font-medium text-foreground">
        {icon && <span className="h-4 w-4 shrink-0 flex items-center justify-center">{icon}</span>}
        <span className="truncate">{children || '—'}</span>
      </div>
    </div>
  );
};
