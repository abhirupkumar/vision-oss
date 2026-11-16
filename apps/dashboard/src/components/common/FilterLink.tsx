import Link from 'next/link';
import type { ReactNode } from 'react';
import { type HTMLAttributes, useState } from 'react';
import { useMessages, useNavigation } from '@/components/hooks';
import { ExternalLink } from '@/components/icons';
import { cn } from '@/lib/cn';

export interface FilterLinkProps extends HTMLAttributes<HTMLDivElement> {
  type: string;
  value: string;
  label?: string;
  icon?: ReactNode;
  externalUrl?: string;
}

export function FilterLink({ type, value, label, externalUrl, icon }: FilterLinkProps) {
  const [showLink, setShowLink] = useState(false);
  const { formatMessage, labels } = useMessages();
  const { updateParams, query } = useNavigation();
  const active = query[type] !== undefined;
  const selected = query[type] === value;

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        active && selected && 'font-bold',
        active && !selected && 'text-muted-foreground',
      )}
      onMouseOver={() => setShowLink(true)}
      onMouseOut={() => setShowLink(false)}
    >
      {icon}
      {!value && `(${label || formatMessage(labels.unknown)})`}
      {value && (
        <span className="max-w-[200px] truncate" title={label || value}>
          <Link href={updateParams({ [type]: `eq.${value}` })} replace>
            {label || value}
          </Link>
        </span>
      )}
      {externalUrl && showLink && (
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-muted-foreground hover:text-foreground"
        >
          <span className="h-3 w-3">
            <ExternalLink />
          </span>
        </a>
      )}
    </div>
  );
}
