'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useLocale } from '@/components/hooks';
import { Button } from '@/components/ui/button';

export interface LinkButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  href: string;
  target?: string;
  scroll?: boolean;
  prefetch?: boolean;
  asAnchor?: boolean;
  children?: ReactNode;
}

export function LinkButton({
  href,
  variant,
  size,
  scroll = true,
  target,
  prefetch,
  children,
  asAnchor,
  className,
  ...props
}: LinkButtonProps) {
  const { dir } = useLocale();

  return (
    <Button variant={variant} size={size} className={className} asChild {...props}>
      {asAnchor ? (
        <a href={href} target={target}>
          {children}
        </a>
      ) : (
        <Link href={href} dir={dir} scroll={scroll} target={target} prefetch={prefetch}>
          {children}
        </Link>
      )}
    </Button>
  );
}
