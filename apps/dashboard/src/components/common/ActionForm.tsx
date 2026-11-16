import type { ReactNode } from 'react';

export function ActionForm({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="font-bold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
