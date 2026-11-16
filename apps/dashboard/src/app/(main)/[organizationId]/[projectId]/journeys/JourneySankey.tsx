'use client';

import { ResponsiveSankey } from '@nivo/sankey';
import { useMemo } from 'react';
import { useTheme } from '@/components/hooks';

interface JourneyItem {
  items: string[];
  count: number;
}

interface SankeyNode {
  id: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

/**
 * Transform flat path sequences from getJourney into Nivo Sankey format.
 * Each hop between consecutive steps becomes a link. Nodes are deduplicated
 * and indexed by step to avoid circular references (e.g. "/" → "/" at step 2
 * becomes "/ (2)" so Nivo treats them as distinct).
 */
function buildSankeyData(journeyData: JourneyItem[]): { nodes: SankeyNode[]; links: SankeyLink[] } {
  const linkMap = new Map<string, number>();
  const nodeSet = new Set<string>();

  for (const journey of journeyData) {
    const { items, count } = journey;
    for (let i = 0; i < items.length - 1; i++) {
      const raw = items[i];
      const rawNext = items[i + 1];
      if (!raw || !rawNext) continue;
      // Suffix each node with its position to prevent cycles
      const src = `${raw} [${i + 1}]`;
      const tgt = `${rawNext} [${i + 2}]`;
      nodeSet.add(src);
      nodeSet.add(tgt);
      const key = `${src}→${tgt}`;
      linkMap.set(key, (linkMap.get(key) ?? 0) + count);
    }
  }

  const nodes: SankeyNode[] = Array.from(nodeSet).map(id => ({ id }));
  const links: SankeyLink[] = Array.from(linkMap.entries()).map(([key, value]) => {
    const [source, target] = key.split('→');
    return { source, target, value };
  });

  return { nodes, links };
}

const PALETTE_LIGHT = [
  'hsl(221,83%,53%)',
  'hsl(160,84%,39%)',
  'hsl(37,91%,55%)',
  'hsl(340,82%,52%)',
  'hsl(271,81%,56%)',
  'hsl(199,89%,48%)',
  'hsl(88,50%,53%)',
];

const PALETTE_DARK = [
  '#38bdf8', // sky-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#f472b6', // pink-400
  '#a78bfa', // violet-400
  '#4ade80', // green-400
  '#f87171', // red-400
  '#22d3ee', // cyan-400
];

export function JourneySankey({ data }: { data: JourneyItem[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { nodes, links } = useMemo(() => buildSankeyData(data), [data]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
        No path data to display for the selected configuration.
      </div>
    );
  }

  return (
    <div style={{ height: Math.max(400, Math.min(nodes.length * 22, 800)) }}>
      <ResponsiveSankey
        data={{ nodes, links }}
        margin={{ top: 8, right: 180, bottom: 8, left: 8 }}
        align="justify"
        colors={isDark ? PALETTE_DARK : PALETTE_LIGHT}
        nodeOpacity={1}
        nodeHoverOthersOpacity={isDark ? 0.45 : 0.35}
        nodeThickness={18}
        nodeSpacing={16}
        nodeBorderWidth={0}
        nodeBorderRadius={3}
        linkOpacity={isDark ? 0.65 : 0.35}
        linkHoverOthersOpacity={isDark ? 0.2 : 0.1}
        linkContract={2}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={12}
        labelTextColor={isDark ? '#f8fafc' : { from: 'color', modifiers: [['darker', 1.2]] }}
        animate={true}
        motionConfig="gentle"
        theme={{
          text: {
            fill: isDark ? '#f8fafc' : '#0f172a',
            fontSize: 12,
          },
          tooltip: {
            container: {
              background: isDark ? '#111827' : '#ffffff',
              color: isDark ? '#f8fafc' : '#0f172a',
              border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              fontSize: 12,
            },
          },
        }}
        nodeTooltip={({ node }: any) => (
          <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: node.color }}
              />
              <p className="font-semibold text-foreground">{node.id}</p>
            </div>
            <p className="text-muted-foreground">
              <span className="text-primary font-semibold">{node.value.toLocaleString()}</span>{' '}
              visitors
            </p>
          </div>
        )}
        linkTooltip={({ link }: any) => (
          <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: link.source.color }}
              />
              <span className="font-semibold text-foreground">{link.source.id}</span>
              <span className="text-muted-foreground">→</span>
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: link.target.color }}
              />
              <span className="font-semibold text-foreground">{link.target.id}</span>
            </div>
            <p className="text-muted-foreground">
              <span className="text-primary font-semibold">{link.value.toLocaleString()}</span>{' '}
              visitors
            </p>
          </div>
        )}
      />
    </div>
  );
}
