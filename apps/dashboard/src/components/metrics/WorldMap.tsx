import { colord } from 'colord';
import { useMemo, useRef, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import {
  useCountryNames,
  useLocale,
  useMessages,
  useProjectMetricsQuery,
  useTheme,
} from '@/components/hooks';
import { getThemeColors } from '@/lib/colors';
import { ISO_COUNTRIES, MAP_FILE } from '@/lib/constants';
import { percentFilter } from '@/lib/filters';
import { formatLongNumber } from '@/lib/format';

export interface WorldMapProps {
  projectId?: string;
  data?: any[];
  className?: string;
  style?: React.CSSProperties;
}

export function WorldMap({ projectId, data, className, style }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { colors } = getThemeColors(theme);
  const { locale } = useLocale();
  const { formatMessage, labels } = useMessages();
  const { countryNames } = useCountryNames(locale);
  const visitorsLabel = formatMessage(labels.visitors).toLocaleLowerCase(locale);
  const unknownLabel = formatMessage(labels.unknown);

  const { data: mapData } = useProjectMetricsQuery(projectId, {
    type: 'country',
  });

  const metrics = useMemo(
    () => (data || mapData ? percentFilter((data || mapData) as any[]) : []),
    [data, mapData],
  );

  const getFillColor = (code: string) => {
    if (code === 'AQ') return 'transparent';
    const country = metrics?.find(({ x }) => x === code);

    if (!country) {
      return theme === 'dark' ? '#1E293B' : '#E2E8F0';
    }

    const baseColor = theme === 'dark' ? '#00E599' : '#059669';
    const intensity = Math.max(0.4, Math.min((country.z || 10) / 100, 1));
    return colord(baseColor).alpha(intensity).toRgbString();
  };

  const getOpacity = (code: string) => {
    return code === 'AQ' ? 0 : 1;
  };

  const handleHover = (code: string, e: React.MouseEvent) => {
    if (code === 'AQ') return;
    const country = metrics?.find(({ x }) => x === code);
    setTooltip(
      `${countryNames[code] || unknownLabel}: ${formatLongNumber(country?.y || 0)} ${visitorsLabel}`,
    );
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ margin: 'auto 0', overflow: 'hidden', position: 'relative', ...style }}
    >
      <ComposableMap projection="geoMercator">
        <ZoomableGroup zoom={0.8} minZoom={0.7} center={[0, 40]}>
          <Geographies geography={`${process.env.basePath || ''}${MAP_FILE}`}>
            {({ geographies }) => {
              return geographies.map(geo => {
                const code = ISO_COUNTRIES[geo.id];

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getFillColor(code)}
                    stroke={theme === 'dark' ? '#334155' : '#CBD5E1'}
                    strokeWidth={0.75}
                    opacity={getOpacity(code)}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: theme === 'dark' ? '#00E599' : '#059669', cursor: 'pointer' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseOver={e => handleHover(code, e)}
                    onMouseOut={() => setTooltip(null)}
                  />
                );
              });
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 8 }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
