import { useMemo, useState } from 'react';
import { DataGrid } from '@/components/common/DataGrid';
import { GridRow } from '@/components/common/GridRow';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { Panel } from '@/components/common/Panel';
import { useDateRange, useMessages, useNavigation, useResultQuery } from '@/components/hooks';
import { useRevenueSessionsQuery } from '@/components/hooks/queries/useRevenueSessionsQuery';
import { CurrencySelect } from '@/components/input/CurrencySelect';
import { ListTable } from '@/components/metrics/ListTable';
import { MetricCard } from '@/components/metrics/MetricCard';
import { MetricLabel } from '@/components/metrics/MetricLabel';
import { MetricsBar } from '@/components/metrics/MetricsBar';
import { RevenueChart } from '@/components/metrics/RevenueChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CURRENCY_CONFIG, DEFAULT_CURRENCY } from '@/lib/constants';
import { formatLongCurrency, formatLongNumber } from '@/lib/format';
import { PROVIDER_MAP, type PaymentProvider } from '@/lib/payments/providers';
import { getItem, setItem } from '@/lib/storage';
import { SessionModal } from '../sessions/SessionModal';
import { SessionsTable } from '../sessions/SessionsTable';

function RevenueSessionsDataTable({
  organizationId,
  projectId,
  currency,
}: {
  organizationId: string;
  projectId: string;
  currency: string;
}) {
  const { updateParams } = useNavigation();
  const queryResult = useRevenueSessionsQuery(projectId, currency);

  return (
    <DataGrid query={queryResult} allowPaging allowSearch>
      {({ data }) => <SessionsTable data={data} projectId={projectId} />}
    </DataGrid>
  );
}

export interface RevenueProps {
  organizationId: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  unit: string;
}

export function Revenue({ organizationId, projectId, startDate, endDate, unit }: RevenueProps) {
  const [currency, setCurrency] = useState(getItem(CURRENCY_CONFIG) || DEFAULT_CURRENCY);

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    setItem(CURRENCY_CONFIG, value);
  };

  const { formatMessage, labels } = useMessages();
  const { compare, isAllTime } = useDateRange();
  const { data, error, isLoading } = useResultQuery<any>('revenue', {
    projectId,
    startDate,
    endDate,
    currency,
    compare,
  });

  const metrics = useMemo(() => {
    if (!data?.total) return [];

    const { sum = 0, count = 0, average = 0, unique_count = 0, arpu = 0, comparison } = data.total;

    return [
      {
        value: sum,
        label: formatMessage(labels.total),
        change: comparison ? sum - (comparison.sum ?? 0) : 0,
        formatValue: (n: number) => formatLongCurrency(n, currency),
      },
      {
        value: average,
        label: formatMessage(labels.aov),
        tooltip: (
          <>
            <div>Average Order Value</div>
            <div>(Total Revenue / Orders)</div>
          </>
        ),
        change: comparison ? average - (comparison.average ?? 0) : 0,
        formatValue: (n: number) => formatLongCurrency(n, currency),
      },
      {
        value: arpu,
        label: formatMessage(labels.arpu),
        tooltip: (
          <>
            <div>Average Revenue Per User</div>
            <div>(Total Revenue / All Sessions)</div>
          </>
        ),
        change: comparison ? arpu - (comparison.arpu ?? 0) : 0,
        formatValue: (n: number) => formatLongCurrency(n, currency),
      },
      {
        value: count,
        label: formatMessage(labels.orders),
        change: comparison ? count - (comparison.count ?? 0) : 0,
        formatValue: formatLongNumber,
      },
      {
        value: unique_count,
        label: formatMessage(labels.uniqueCustomers),
        change: comparison ? unique_count - (comparison.unique_count ?? 0) : 0,
        formatValue: formatLongNumber,
      },
    ] as any;
  }, [data, currency]);

  const renderLabel = (type: string) => (data: any) => <MetricLabel type={type} data={data} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: '280px' }}>
        <CurrencySelect value={currency} onChange={handleCurrencyChange} />
      </div>
      <LoadingPanel data={data} isLoading={isLoading} error={error}>
        {data && (
          <div className="flex flex-col gap-4">
            <MetricsBar>
              {metrics?.map(({ label, value, change, formatValue, tooltip }: any) => {
                return (
                  <MetricCard
                    key={label}
                    value={value}
                    label={label}
                    tooltip={tooltip}
                    change={change}
                    formatValue={formatValue}
                    showChange={!isAllTime}
                  />
                );
              })}
            </MetricsBar>

            {/* Gateway Breakdown Cards (shown when multiple gateways exist) */}
            {data?.gateways && data.gateways.length > 1 && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment Gateway Breakdown
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {data.gateways.length} gateways connected
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {data.gateways.map((gw: any) => {
                    const cfg = PROVIDER_MAP[gw.provider as PaymentProvider];
                    const logo = cfg?.logo ?? '💳';
                    const name = gw.name || cfg?.label || gw.provider;
                    const pct =
                      gw.percent !== undefined && !isNaN(gw.percent)
                        ? gw.percent
                        : data?.total?.sum
                          ? (gw.revenue / data.total.sum) * 100
                          : 0;
                    const avg = gw.count > 0 ? gw.revenue / gw.count : 0;

                    return (
                      <div
                        key={gw.connectionId || gw.provider}
                        className="flex flex-col justify-between p-4 rounded-xl border border-border bg-card shadow-xs transition-all hover:border-border/80"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{logo}</span>
                            <span className="font-semibold text-sm text-foreground">{name}</span>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {pct.toFixed(1)}%
                          </span>
                        </div>

                        <div className="space-y-1 my-1">
                          <div className="text-2xl font-bold tabular-nums text-foreground">
                            {formatLongCurrency(gw.revenue || 0, currency)}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatLongNumber(gw.count || 0)} orders</span>
                            {gw.count > 0 && (
                              <span>Avg: {formatLongCurrency(avg, currency)}</span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(Math.max(pct, 2), 100)}%`,
                              backgroundColor: cfg?.color || 'var(--primary)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Panel>
              <RevenueChart
                data={data.chart || []}
                unit={unit}
                minDate={startDate}
                maxDate={endDate}
                currency={currency}
              />
            </Panel>
            <div className="grid gap-3">
              <GridRow layout="two">
                <Panel>
                  <h2 className="mb-4 text-2xl font-semibold">{formatMessage(labels.sources)}</h2>
                  <Tabs defaultValue="referrer">
                    <TabsList className="mb-4">
                      <TabsTrigger value="referrer">{formatMessage(labels.referrers)}</TabsTrigger>
                      <TabsTrigger value="channel">{formatMessage(labels.channels)}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="referrer">
                      <ListTable
                        title={formatMessage(labels.referrer)}
                        metric={formatMessage(labels.revenue)}
                        data={data?.referrer?.map(
                          ({ name, value }: { name: string; value: number }) => ({
                            label: name,
                            count: Number(value),
                            percent: data?.total?.sum ? (value / data.total.sum) * 100 : 0,
                          }),
                        )}
                        currency={currency}
                        renderLabel={renderLabel('referrer')}
                      />
                    </TabsContent>
                    <TabsContent value="channel">
                      <ListTable
                        title={formatMessage(labels.channel)}
                        metric={formatMessage(labels.revenue)}
                        data={data?.channel?.map(
                          ({ name, value }: { name: string; value: number }) => ({
                            label: name,
                            count: Number(value),
                            percent: data?.total?.sum ? (value / data.total.sum) * 100 : 0,
                          }),
                        )}
                        currency={currency}
                        renderLabel={renderLabel('channel')}
                      />
                    </TabsContent>
                  </Tabs>
                </Panel>
                <Panel>
                  <h2 className="mb-4 text-2xl font-semibold">{formatMessage(labels.location)}</h2>
                  <Tabs defaultValue="country">
                    <TabsList className="mb-4">
                      <TabsTrigger value="country">{formatMessage(labels.countries)}</TabsTrigger>
                      <TabsTrigger value="region">{formatMessage(labels.regions)}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="country">
                      <ListTable
                        title={formatMessage(labels.country)}
                        metric={formatMessage(labels.revenue)}
                        data={data?.country?.map(
                          ({ name, value }: { name: string; value: number }) => ({
                            label: name,
                            count: Number(value),
                            percent: data?.total?.sum ? (value / data.total.sum) * 100 : 0,
                          }),
                        )}
                        currency={currency}
                        renderLabel={renderLabel('country')}
                      />
                    </TabsContent>
                    <TabsContent value="region">
                      <ListTable
                        title={formatMessage(labels.region)}
                        metric={formatMessage(labels.revenue)}
                        data={data?.region?.map(
                          ({
                            name,
                            value,
                            country,
                          }: {
                            name: string;
                            value: number;
                            country: string;
                          }) => ({
                            label: name,
                            country,
                            count: Number(value),
                            percent: data?.total?.sum ? (value / data.total.sum) * 100 : 0,
                          }),
                        )}
                        currency={currency}
                        renderLabel={renderLabel('region')}
                      />
                    </TabsContent>
                  </Tabs>
                </Panel>
              </GridRow>
            </div>
            <Panel>
              <h2 className="mb-4 text-2xl font-semibold">{formatMessage(labels.customers)}</h2>
              <RevenueSessionsDataTable
                organizationId={organizationId}
                projectId={projectId}
                currency={currency}
              />
            </Panel>
          </div>
        )}
      </LoadingPanel>
      <SessionModal projectId={projectId} />
    </div>
  );
}
