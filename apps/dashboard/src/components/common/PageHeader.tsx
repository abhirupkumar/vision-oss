import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  label,
  icon,
  showBorder = true,
  titleHref,
  children,
}: {
  title: string;
  description?: string;
  label?: ReactNode;
  icon?: ReactNode;
  showBorder?: boolean;
  titleHref?: string;
  allowEdit?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between ${showBorder ? 'mb-6 border-b border-border' : 'mb-4'
        }`}
    >
      {/* Left side: label + title + description */}
      <div className="flex flex-col gap-1.5">
        {label}
        <div className="flex items-center gap-3">
          {icon && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
              {icon}
            </span>
          )}
          {title && titleHref ? (
            <Link
              href={titleHref}
              className="text-xl font-semibold text-foreground hover:underline md:text-2xl lg:text-3xl"
            >
              {title}
            </Link>
          ) : (
            title && (
              <h1 className="text-xl font-semibold text-foreground md:text-2xl lg:text-3xl">
                {title}
              </h1>
            )
          )}
        </div>
        {description && (
          <p className="max-w-150 truncate text-sm text-muted-foreground" title={description}>
            {description}
          </p>
        )}
      </div>

      {/* Right side: action buttons */}
      {children && <div className="flex shrink-0 items-center justify-end gap-2">{children}</div>}
    </div>
  );
}
