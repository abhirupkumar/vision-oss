import type { ReactNode } from 'react';

export function SectionHeader({
  title,
  description,
  icon,
  children,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  allowEdit?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-[60px] items-center justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-5 w-5 items-center justify-center text-muted-foreground">
            {icon}
          </span>
        )}
        {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
        {description && <span className="text-sm text-muted-foreground">{description}</span>}
      </div>
      <div className="flex items-center justify-end">{children}</div>
    </div>
  );
}
