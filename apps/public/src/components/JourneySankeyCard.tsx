import React from 'react';
import { ResponsiveSankey } from '@nivo/sankey';

interface JourneyItem {
  items: string[];
  count: number;
}

const DUMMY_JOURNEY_DATA: JourneyItem[] = [
  { items: ['/', '/pricing', '/checkout', '/success'], count: 420 },
  { items: ['/', '/features', '/pricing', '/checkout'], count: 310 },
  { items: ['/', '/blog', '/'], count: 150 },
  { items: ['/marketing', '/', '/pricing'], count: 280 },
  { items: ['/docs', '/features', '/contact'], count: 90 },
];

function buildSankeyData(journeyData: JourneyItem[]) {
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

  const nodes = Array.from(nodeSet).map(id => ({ id }));
  const links = Array.from(linkMap.entries()).map(([key, value]) => {
    const [source, target] = key.split('→');
    return { source, target, value };
  });

  return { nodes, links };
}

const PALETTE = [
  'hsl(221,83%,53%)',
  'hsl(160,84%,39%)',
  'hsl(37,91%,55%)',
  'hsl(340,82%,52%)',
  'hsl(271,81%,56%)',
  'hsl(199,89%,48%)',
  'hsl(88,50%,53%)',
];

export default function JourneySankeyCard() {
  const { nodes, links } = React.useMemo(() => buildSankeyData(DUMMY_JOURNEY_DATA), []);

  return (
    <div className="w-full h-full flex flex-col pt-2">
      <div className="flex-1 w-full relative min-h-[250px]">
        <ResponsiveSankey
          data={{ nodes, links }}
          margin={{ top: 12, right: 130, bottom: 12, left: 12 }}
          align="justify"
          colors={PALETTE}
          nodeOpacity={1}
          nodeHoverOthersOpacity={0.35}
          nodeThickness={16}
          nodeSpacing={20}
          nodeBorderWidth={0}
          nodeBorderRadius={3}
          linkOpacity={0.35}
          linkHoverOthersOpacity={0.1}
          linkContract={2}
          enableLinkGradient={true}
          labelPosition="outside"
          labelOrientation="horizontal"
          labelPadding={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.5]] }}
          animate={true}
          motionConfig="gentle"
          theme={{
            labels: { text: { fontSize: 11, fontFamily: 'Sora, sans-serif' } },
          }}
          nodeTooltip={({ node }: any) => (
            <div className="rounded-md border border-border-light bg-surface-white px-2 py-1 shadow-md text-xs">
              <p className="font-semibold text-text-primary">{node.id.split(' ')[0]}</p>
              <p className="text-text-secondary">
                <span className="text-primary font-medium">{node.value.toLocaleString()}</span> drops
              </p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
