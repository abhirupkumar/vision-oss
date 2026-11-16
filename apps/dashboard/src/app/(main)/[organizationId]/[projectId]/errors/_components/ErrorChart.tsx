"use client";

import { colord } from 'colord';
import { useCallback, useMemo } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import {
  useDateRange,
  useLocale,
  useProjectErrorChartQuery,
  useTimezone,
  useProject,
} from '@/components/hooks';
import { renderDateLabels } from '@/lib/charts';
import { CHART_COLORS } from '@/lib/constants';
import { generateTimeSeries } from '@/lib/date';
import { ErrorChartData } from './types';

export function ErrorChart() {
  const { projectId } = useProject();
  const { timezone } = useTimezone();
  const {
    dateRange: { startDate, endDate, unit },
  } = useDateRange({ timezone });
  const { locale, dateLocale } = useLocale();
  const { data, isLoading, error } = useProjectErrorChartQuery(projectId);

  const chartData: any = useMemo(() => {
    if (!data) return;

    // Convert data to time series
    // the data format is [{ date: '2023-10-10 10:00:00', totalErrors: 10, affectedUsers: 2 }]
    const errorSeries = data.map((d: ErrorChartData) => ({ x: d.date, y: d.totalErrors }));
    
    if (errorSeries.length === 0) {
      return {
        datasets: [
          {
            data: generateTimeSeries([], startDate, endDate, unit, dateLocale),
            lineTension: 0,
            borderWidth: 1,
          },
        ],
      };
    }

    const color = colord(CHART_COLORS[0]);

    return {
      datasets: [
        {
          label: 'Errors',
          data: generateTimeSeries(errorSeries, startDate, endDate, unit, dateLocale),
          lineTension: 0,
          backgroundColor: color.alpha(0.6).toRgbString(),
          borderColor: color.alpha(0.7).toRgbString(),
          borderWidth: 1,
        }
      ],
    };
  }, [data, startDate, endDate, unit, dateLocale]);

  const renderXLabel = useCallback(renderDateLabels(unit, locale), [unit, locale]);

  return (
    <LoadingPanel isLoading={isLoading} error={error} minHeight="400px">
      <div className="border rounded-lg bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Errors over time</h2>
        {chartData && (
          <BarChart
            chartData={chartData}
            unit={unit}
            stacked={false}
            renderXLabel={renderXLabel}
            height="400px"
          />
        )}
      </div>
    </LoadingPanel>
  );
}
