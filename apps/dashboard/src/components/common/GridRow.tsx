import { cn } from '@/lib/cn';

const LAYOUT_CLASSES = {
  one: 'grid-cols-1',
  two: 'grid-cols-1 md:grid-cols-2',
  three: 'grid-cols-1 md:grid-cols-3',
  'one-two': 'grid-cols-1 md:grid-cols-3',
  'two-one': 'grid-cols-1 md:grid-cols-3',
  compare: 'grid-cols-1 md:grid-cols-2',
};

export function GridRow(props: {
  layout?: 'one' | 'two' | 'three' | 'one-two' | 'two-one' | 'compare';
  className?: string;
  minHeight?: string;
  children?: any;
}) {
  const { layout = 'two', className, minHeight, children } = props;
  return (
    <div
      className={cn('grid gap-3', LAYOUT_CLASSES[layout], className)}
      style={minHeight ? { minHeight } : undefined}
    >
      {children}
    </div>
  );
}
