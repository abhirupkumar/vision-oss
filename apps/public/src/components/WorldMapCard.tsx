import React, { useState, useMemo, useRef } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { colord } from 'colord';

const MAP_FILE = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// ISO 3166-1 alpha-3 to simple names mapping
const countryNames: Record<string, string> = {
  USA: 'United States',
  GBR: 'United Kingdom',
  FRA: 'France',
  DEU: 'Germany',
  JPN: 'Japan',
  AUS: 'Australia',
  BRA: 'Brazil',
  IND: 'India',
  CAN: 'Canada',
  ZAF: 'South Africa',
  ESP: 'Spain',
  ITA: 'Italy'
};

export default function WorldMapCard() {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulated live metrics mapped to topojson names
  const metrics = useMemo(() => [
    { id: 'United States of America', val: 45020 },
    { id: 'United Kingdom', val: 12400 },
    { id: 'France', val: 8900 },
    { id: 'Germany', val: 15300 },
    { id: 'Japan', val: 10200 },
    { id: 'Australia', val: 6500 },
    { id: 'Brazil', val: 11200 },
    { id: 'India', val: 24500 },
    { id: 'China', val: 32000 },
    { id: 'Canada', val: 9500 },
  ], []);

  const getFillColor = (name: string) => {
    if (name === 'Antarctica') return 'transparent'; // Antarctica
    const country = metrics.find((m) => m.id === name);
    
    // Base surface color for countries with no data
    if (!country) return '#f3f4f6';

    // Lighten logic based on value
    const maxVal = 50000;
    const ratio = Math.min(country.val / maxVal, 1);
    
    // Using our primary color logic (#ac2e00)
    return colord('#ac2e00')
      .lighten(0.4 * (1.0 - ratio))
      .toHex();
  };

  const handleHover = (geo: any, e: React.MouseEvent) => {
    const name = geo.properties.name || 'Unknown';
    if (name === 'Antarctica') return;
    
    const country = metrics.find((m) => m.id === name);
    const val = country ? country.val : 0;
    
    setTooltip(`${name}: ${val.toLocaleString()} visitors`);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-surface-bright rounded border border-border flex items-center justify-center cursor-move"
    >
      <ComposableMap projection="geoMercator">
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={5} center={[0, 20]}>
          <Geographies geography={MAP_FILE}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const name = geo.properties.name;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getFillColor(name)}
                    stroke="#e5e7eb"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: '#f1592a', cursor: 'pointer' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseOver={(e) => handleHover(geo, e)}
                    onMouseOut={() => setTooltip(null)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 rounded-md border border-border-light bg-surface-white px-2 py-1 text-xs text-text-primary shadow-md font-medium"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 8 }}
        >
          {tooltip}
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 flex gap-1 pointer-events-none">
        <span className="text-[10px] text-text-secondary bg-surface-white/80 px-1.5 py-0.5 rounded shadow-sm">Pan & Zoom Enabled</span>
      </div>
    </div>
  );
}
