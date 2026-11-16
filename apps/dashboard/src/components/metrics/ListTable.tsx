import { config, useSpring } from '@react-spring/web';
import { Search } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { FixedSizeList } from 'react-window';
import { AnimatedDiv } from '@/components/common/AnimatedDiv';
import { Empty } from '@/components/common/Empty';
import { useMessages, useMobile } from '@/components/hooks';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { formatLongCurrency, formatLongNumber } from '@/lib/format';

const ITEM_SIZE = 34;

interface ListData {
  label: string;
  count: number;
  percent: number;
}

export interface ListTableProps {
  data?: ListData[];
  title?: string;
  metric?: string;
  className?: string;
  renderLabel?: (data: ListData, index: number) => ReactNode;
  renderChange?: (data: ListData, index: number) => ReactNode;
  animate?: boolean;
  virtualize?: boolean;
  showPercentage?: boolean;
  itemCount?: number;
  currency?: string;
}

export function ListTable({
  data = [],
  title,
  metric,
  renderLabel,
  renderChange,
  animate = true,
  virtualize = false,
  showPercentage = true,
  itemCount = 10,
  currency,
}: ListTableProps) {
  const { formatMessage, labels } = useMessages();
  const { isPhone } = useMobile();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => item.label?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data, searchTerm]);

  const maxPercent = useMemo(() => {
    const values = filteredData.map(item => item.percent).filter(n => !isNaN(n));
    return values.length > 0 ? Math.max(...values) : 100;
  }, [filteredData]);

  const getRow = (row: ListData, index: number) => {
    const { label, count, percent } = row;

    return (
      <AnimatedRow
        key={`${label}${index}`}
        label={renderLabel ? renderLabel(row, index) : (label ?? formatMessage(labels.unknown))}
        value={count}
        percent={percent}
        scalePercent={maxPercent > 0 ? (percent / maxPercent) * 100 : 0}
        animate={animate && !virtualize}
        showPercentage={showPercentage}
        change={renderChange ? renderChange(row, index) : null}
        currency={currency}
        isPhone={isPhone}
      />
    );
  };

  const ListTableRow = ({ index, style }) => {
    return <div style={style}>{getRow(filteredData[index], index)}</div>;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Search Bar */}
      <div className="relative px-2 border bg-muted/40 rounded-sm">
        <Search className="absolute left-5 top-2.5 h-4 w-4 text-muted-foreground/50" />
        <Input
          placeholder={`${formatMessage(labels.search)}...`}
          className="h-9 pl-9 border-none focus-visible:ring-1 text-sm placeholder:text-muted-foreground/50 transition-all hover:bg-muted/60"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div
        className="grid items-center px-2 py-1"
        style={{ gridTemplateColumns: `1fr ${showPercentage ? '180px' : '80px'}` }}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-foreground/90">
          {title}
        </span>
        <span className="text-center text-xs font-bold uppercase tracking-wider text-foreground/90">
          {metric}
        </span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1 px-1">
        {filteredData?.length === 0 && <Empty />}
        {virtualize && filteredData.length > 0 ? (
          <FixedSizeList
            width="100%"
            height={itemCount * ITEM_SIZE}
            itemCount={filteredData.length}
            itemSize={ITEM_SIZE}
          >
            {ListTableRow}
          </FixedSizeList>
        ) : (
          filteredData.map(getRow)
        )}
      </div>
    </div>
  );
}

const AnimatedRow = ({
  label,
  value = 0,
  percent,
  scalePercent,
  change,
  animate,
  showPercentage = true,
  currency,
  isPhone,
}) => {
  const props = useSpring({
    width: scalePercent,
    displayPercent: percent,
    y: !Number.isNaN(value) ? value : 0,
    from: { width: 0, displayPercent: 0, y: 0 },
    config: animate ? config.default : { duration: 0 },
  });

  return (
    <div className="relative group overflow-hidden rounded-md transition-all hover:shadow-sm">
      {/* Progress Background */}
      <AnimatedDiv
        className="absolute inset-y-0 left-0 bg-black/[0.04] dark:bg-black/40 pointer-events-none"
        style={{ width: props.width.to(n => `${n}%`) }}
      />

      <div
        className="grid items-center px-2 hover:bg-accent/5 transition-colors relative z-10"
        style={{ gridTemplateColumns: '1fr 50px 50px' }}
      >
        {/* Label */}
        <div className="flex items-center overflow-hidden py-1.5">
          <span
            className="truncate text-sm font-medium text-foreground"
            style={{ maxWidth: isPhone ? '200px' : '400px' }}
          >
            {label}
          </span>
        </div>

        {/* Count */}
        <div className="flex h-[34px] items-center justify-end pr-2">
          {change}
          <span className="text-sm font-bold tabular-nums text-foreground">
            <AnimatedDiv title={props?.y as any}>
              {currency
                ? props.y?.to(n => formatLongCurrency(n, currency))
                : props.y?.to(formatLongNumber)}
            </AnimatedDiv>
          </span>
        </div>

        {/* Percent */}
        {showPercentage && (
          <div
            className="relative flex items-center justify-start pl-3 text-xs font-bold text-muted-foreground/80 tabular-nums border-l border-border/50"
          >
            <AnimatedDiv>{props.displayPercent.to(n => `${n?.toFixed?.(0)}%`)}</AnimatedDiv>
          </div>
        )}
      </div>
    </div>
  );
};
