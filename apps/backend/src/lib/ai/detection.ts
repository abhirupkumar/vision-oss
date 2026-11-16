export interface DetectedSignal {
  metric: string;
  label: string;
  current: number;
  baseline: number;
  deltaPercent: number;
  direction: 'up' | 'down';
  severity: 'info' | 'warning' | 'critical';
  method: 'wow' | 'zscore' | 'ewma' | 'iqr';
  detectedAt: string;
}
export function buildComparisonPeriod(days: number = 7) {
  return { lookbackDays: days };
}
export async function detectSignals(_params: any): Promise<DetectedSignal[]> {
  return [];
}
