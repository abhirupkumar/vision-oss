import type { ReactNode } from 'react';

export function TypeIcon({
  type,
  value,
  children,
}: {
  type: 'browser' | 'country' | 'device' | 'os';
  value: string;
  children?: ReactNode;
}) {
  const normalizedValue = value?.replaceAll(' ', '-').toLowerCase() || 'unknown';
  const src = `${process.env.basePath || ''}/images/${type}/${normalizedValue}.png`;
  const fallback = `${process.env.basePath || ''}/images/${type}/unknown.png`;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <img
        src={src}
        onError={e => {
          if (e.currentTarget.src !== fallback) {
            e.currentTarget.src = fallback;
          }
        }}
        alt={value}
        className={type === 'country' ? 'h-3' : 'h-4 w-4 shrink-0'}
      />
      {children && <span className="truncate text-sm">{children}</span>}
    </div>
  );
}
