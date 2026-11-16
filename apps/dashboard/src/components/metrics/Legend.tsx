import type { LegendItem } from 'chart.js/auto';
import { colord } from 'colord';

export function Legend({
  items = [],
  onClick,
}: {
  items: any[];
  onClick: (index: LegendItem) => void;
}) {
  if (!items.find(({ text }) => text)) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.map(item => {
        const { text, fillStyle, hidden } = item;
        const color = colord(fillStyle);

        return (
          <button
            key={text}
            type="button"
            onClick={() => onClick(item)}
            className="flex items-center gap-1.5 text-sm"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color.alpha(color.alpha() + 0.2).toHex() }}
            />
            <span
              className="max-w-[300px] truncate"
              style={{ color: hidden ? 'var(--muted-foreground)' : undefined }}
            >
              {text}
            </span>
          </button>
        );
      })}
    </div>
  );
}
