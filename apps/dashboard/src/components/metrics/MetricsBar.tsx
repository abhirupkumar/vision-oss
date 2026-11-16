import type { ReactNode } from 'react';

export function MetricsBar({ children }: { children?: ReactNode }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
    >
      {children}
    </div>
  );
}
