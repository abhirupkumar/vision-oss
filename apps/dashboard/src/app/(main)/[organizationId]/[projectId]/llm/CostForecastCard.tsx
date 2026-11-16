import { getLlmCostForecast } from '@vision/db';
import { TrendingUp } from 'lucide-react';

interface Props { projectId: string; }

export async function CostForecastCard({ projectId }: Props) {
  const forecast = await getLlmCostForecast(projectId);
  const { mtdCost, projectedMonthCost, daysElapsed, daysInMonth } = forecast;

  const progressPct = Math.min(100, (daysElapsed / daysInMonth) * 100);
  const costBarPct = projectedMonthCost > 0
    ? Math.min(100, (mtdCost / projectedMonthCost) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Month to Date</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5">${mtdCost.toFixed(4)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Projected</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5 text-primary">
            ${projectedMonthCost.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Progress bar — days elapsed */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Day {daysElapsed} of {daysInMonth}</span>
          <span>{Math.round(progressPct)}% through month</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-muted-foreground/40 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Cost bar — MTD vs projected */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Spend progress</span>
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${costBarPct}%` }}
          />
        </div>
      </div>

      {mtdCost === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          No LLM spend this month yet.
        </p>
      )}
    </div>
  );
}
