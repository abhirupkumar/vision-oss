import type { ReactNode } from 'react';

export interface EmptyPlaceholderProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export function EmptyPlaceholder({ title, description, icon, children }: EmptyPlaceholderProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5">
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center text-muted-foreground/40">
          {icon}
        </span>
      )}
      {title && <p className="text-xl font-bold text-foreground">{title}</p>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}
