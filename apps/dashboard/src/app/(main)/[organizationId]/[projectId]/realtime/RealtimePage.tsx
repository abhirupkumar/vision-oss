'use client';
import { firstBy } from 'thenby';
import { GridRow } from '@/components/common/GridRow';
import { PageBody } from '@/components/common/PageBody';
import { Panel } from '@/components/common/Panel';
import { useMobile, useRealtimeQuery } from '@/components/hooks';
import { RealtimeChart } from '@/components/metrics/RealtimeChart';
import { WorldMap } from '@/components/metrics/WorldMap';
import { percentFilter } from '@/lib/filters';
import { RealtimeCountries } from './RealtimeCountries';
import { RealtimeHeader } from './RealtimeHeader';
import { RealtimeLog } from './RealtimeLog';
import { RealtimePaths } from './RealtimePaths';
import { RealtimeReferrers } from './RealtimeReferrers';

export function RealtimePage({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useRealtimeQuery(projectId);
  const { isMobile } = useMobile();

  if (isLoading || error) {
    return <PageBody isLoading={isLoading} error={error} />;
  }

  const countries = percentFilter(
    Object.keys(data.countries)
      .map(key => ({ x: key, y: data.countries[key] }))
      .sort(firstBy('y', -1)),
  );

  return (
    <div className="grid gap-3">
      <RealtimeHeader data={data} />
      <Panel>
        <RealtimeChart data={data} unit="minute" />
      </Panel>
      <Panel>
        <RealtimeLog data={data} />
      </Panel>
      <GridRow layout="two">
        <Panel>
          <RealtimePaths data={data} />
        </Panel>
        <Panel>
          <RealtimeReferrers data={data} />
        </Panel>
      </GridRow>
      <GridRow layout="one-two">
        <Panel>
          <RealtimeCountries data={countries} />
        </Panel>
        <Panel className={isMobile ? '' : 'md:col-span-2'}>
          <WorldMap data={countries} />
        </Panel>
      </GridRow>
    </div>
  );
}
