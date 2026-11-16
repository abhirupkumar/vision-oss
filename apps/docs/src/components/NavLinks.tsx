'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const linkClassName =
  'inline-flex items-center gap-2 text-fd-muted-foreground text-sm transition-colors hover:text-fd-accent-foreground data-[active=true]:font-medium data-[active=true]:text-fd-foreground [&_svg]:size-4';

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  isActive: boolean;
}

function NavLink({ href, icon, children, isActive }: NavLinkProps) {
  return (
    <Link href={href} data-active={isActive} className={linkClassName}>
      {icon}
      {children}
    </Link>
  );
}

const excludedPaths = ['/guides', '/api', '/cloud'];

export function DocumentationLink({ icon }: { icon: ReactNode }) {
  const pathname = usePathname();
  const isActive =
    pathname === '/' ||
    (!excludedPaths.some((path) => pathname.startsWith(path)) &&
     pathname !== '/api' && pathname !== '/guides' && pathname !== '/cloud');

  return (
    <NavLink href="/" icon={icon} isActive={isActive}>
      Documentation
    </NavLink>
  );
}

export function GuidesLink({ icon }: { icon: ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith('/guides');

  return (
    <NavLink href="/guides" icon={icon} isActive={isActive}>
      Guides
    </NavLink>
  );
}

export function ApiLink({ icon }: { icon: ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith('/api');

  return (
    <NavLink href="/api" icon={icon} isActive={isActive}>
      API Reference
    </NavLink>
  );
}

export function CloudLink({ icon }: { icon: ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith('/cloud');

  return (
    <NavLink href="/cloud" icon={icon} isActive={isActive}>
      Cloud
    </NavLink>
  );
}

export function ExternalNavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClassName}
    >
      {children}
      <ExternalLink className="size-3" />
    </Link>
  );
}
