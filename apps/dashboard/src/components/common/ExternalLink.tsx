import { ExternalLink as LinkIcon } from 'lucide-react';
import Link, { type LinkProps } from 'next/link';
import type { ReactNode } from 'react';

export function ExternalLink({
  href,
  children,
  ...props
}: LinkProps & { href: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 overflow-hidden group">
      <span className="truncate text-sm" title={href}>
        <Link
          {...props}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          {children}
        </Link>
      </span>
      <LinkIcon
        size={12}
        className="shrink-0 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}
