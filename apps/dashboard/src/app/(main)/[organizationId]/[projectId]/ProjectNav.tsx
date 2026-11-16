'use client';

import {
  Activity,
  ArrowLeft,
  BadgeDollarSign,
  BarChart3,
  FlaskConical,
  Settings,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useNavigation } from '@/components/hooks';
import { ProjectSelect } from '@/components/input/ProjectSelect';
import { BillingAlertIcon } from '@/components/billing/BillingAlertIcon';
import { HAS_BILLING, HAS_MCP } from '@/lib/features';
import { cn } from '@/lib/cn';

interface NavItem {
  id: string;
  label: string;
  path: string;
}

interface NavCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  rootPath: string;
  match: (pathname: string) => boolean;
  items: NavItem[];
}

export function ProjectNav({
  projectId,
  onItemClick,
}: {
  projectId: string;
  onItemClick?: () => void;
}) {
  const { pathname, renderUrl, organizationId, router } = useNavigation();

  const renderPath = (path: string) =>
    renderUrl(`/${projectId}${path}`, {
      event: undefined,
      compare: undefined,
      view: undefined,
    });

  const categories: NavCategory[] = [
    {
      id: 'analytics',
      label: 'Product Analytics',
      icon: <BarChart3 className="h-5 w-5 shrink-0" />,
      rootPath: renderPath(''),
      match: (p: string) =>
        !p.includes('/llm') &&
        !p.includes('/revenue') &&
        !p.includes('/unit-economics') &&
        !p.includes('/budget-alerts') &&
        !p.includes('/ab-tests') &&
        !p.includes('/feature-flags') &&
        !p.includes('/cohorts') &&
        !p.includes('/errors') &&
        !p.includes('/performance') &&
        !p.includes('/mcp') &&
        !p.includes('/nlq') &&
        !p.includes('/settings') &&
        !p.includes('/members'),
      items: [
        { id: 'overview', label: 'Overview', path: renderPath('') },
        { id: 'events', label: 'Events', path: renderPath('/events') },
        { id: 'sessions', label: 'Sessions', path: renderPath('/sessions') },
        { id: 'visitors', label: 'Visitor Tracking', path: renderPath('/visitors') },
        { id: 'funnels', label: 'Funnels', path: renderPath('/funnels') },
        { id: 'journeys', label: 'Journeys', path: renderPath('/journeys') },
        { id: 'retention', label: 'Retention', path: renderPath('/retention') },
        { id: 'replays', label: 'Replays', path: renderPath('/replays') },
        { id: 'realtime', label: 'Realtime', path: renderPath('/realtime') },
        { id: 'compare', label: 'Compare', path: renderPath('/compare') },
      ],
    },
    {
      id: 'llm',
      label: 'LLM Observability',
      icon: <Sparkles className="h-5 w-5 shrink-0" />,
      rootPath: renderPath('/llm'),
      match: (p: string) => p.includes('/llm'),
      items: [
        { id: 'llm-traces', label: 'Traces & AI Cost Tracking', path: renderPath('/llm') },
        { id: 'llm-users', label: 'User LLM Spend', path: renderPath('/llm/users') },
        { id: 'llm-templates', label: 'Prompt Templates', path: renderPath('/llm/templates') },
        { id: 'llm-models', label: 'Model Benchmarks', path: renderPath('/llm/models') },
      ],
    },
    {
      id: 'unit-economics',
      label: 'Unit Economics',
      icon: <BadgeDollarSign className="h-5 w-5 shrink-0" />,
      rootPath: renderPath('/unit-economics'),
      match: (p: string) =>
        p.includes('/revenue') || p.includes('/unit-economics') || p.includes('/budget-alerts'),
      items: [
        { id: 'business-scorecard', label: 'Business Scorecard', path: renderPath('/unit-economics') },
        { id: 'revenue-analytics', label: 'Revenue Analytics', path: renderPath('/revenue') },
        { id: 'margins-by-user', label: 'Margins by User', path: renderPath('/revenue/users') },
        { id: 'budget-alerts', label: 'Budget Guardrails', path: renderPath('/budget-alerts') },
      ],
    },
    {
      id: 'experiments',
      label: 'Experiments',
      icon: <FlaskConical className="h-5 w-5 shrink-0" />,
      rootPath: renderPath('/ab-tests'),
      match: (p: string) =>
        p.includes('/ab-tests') ||
        p.includes('/feature-flags') ||
        p.includes('/cohorts') ||
        p.includes('/mcp') ||
        p.includes('/nlq'),
      items: [
        { id: 'ab-tests', label: 'A/B Tests', path: renderPath('/ab-tests') },
        { id: 'feature-flags', label: 'Feature Flags', path: renderPath('/feature-flags') },
        { id: 'cohorts', label: 'Cohorts', path: renderPath('/cohorts') },
        ...(HAS_MCP ? [
          { id: 'mcp-guide', label: 'Ask AI (MCP)', path: renderPath('/mcp') },
          { id: 'mcp-tools', label: 'Tool Catalog', path: renderPath('/mcp/tools') },
          { id: 'mcp-status', label: 'Connection Status', path: renderPath('/mcp/status') },
        ] : []),
      ],
    },
    {
      id: 'health',
      label: 'Errors & Performance',
      icon: <Activity className="h-5 w-5 shrink-0" />,
      rootPath: renderPath('/errors'),
      match: (p: string) => p.includes('/errors') || p.includes('/performance'),
      items: [
        { id: 'errors', label: 'Errors', path: renderPath('/errors') },
        { id: 'performance', label: 'Performance', path: renderPath('/performance') },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5 shrink-0" />,
      rootPath: renderPath('/settings'),
      match: (p: string) => p.includes('/settings') || p.includes('/members'),
      items: [
        { id: 'settings-project', label: 'Project Details', path: renderPath('/settings') },
        { id: 'settings-preferences', label: 'Preferences & Theme', path: renderPath('/settings/preferences') },
        { id: 'settings-profile', label: 'Profile & Account', path: renderUrl('/settings/profile') },
        { id: 'settings-org', label: 'Organization Settings', path: renderUrl('/settings') },
        ...(HAS_BILLING ? [{ id: 'settings-billing', label: 'Billing & Usage', path: '/settings/billing' }] : []),
        { id: 'settings-members', label: 'Team Members', path: renderUrl('/members') },
      ],
    },
  ];

  // Determine active category based on current pathname
  const activeCategory =
    categories.find((cat) => cat.match(pathname)) || categories[0];

  const handleProjectChange = (value: string) => {
    router.push(renderUrl(`/${value}`));
  };

  const isItemActive = (itemPath: string) => {
    const targetPure = itemPath.split('?')[0];
    const currentPure = pathname.split('?')[0];
    if (
      targetPure === renderPath('') ||
      targetPure === renderPath('/settings') ||
      targetPure === renderUrl('/settings') ||
      targetPure === renderPath('/mcp') ||
      targetPure === renderPath('/llm') ||
      targetPure === renderPath('/revenue')
    ) {
      return currentPure === targetPure;
    }
    return currentPure === targetPure || currentPure.startsWith(`${targetPure}/`);
  };

  return (
    <div className="flex h-full">
      {/* ── Primary Sidebar (Rail): Icon format, expands on hover ── */}
      <div className="group/rail relative z-20 flex h-full w-14 hover:w-56 flex-col border-r border-border bg-muted/40 transition-all duration-200 ease-in-out">
        <div className="flex flex-1 flex-col gap-1.5 p-2 overflow-y-auto overflow-x-hidden">
          {categories.map((cat) => {
            const isActive = activeCategory.id === cat.id;
            return (
              <Link
                key={cat.id}
                href={cat.rootPath}
                onClick={onItemClick}
                title={cat.label}
                className={cn(
                  'flex items-center gap-3.5 rounded-lg px-2.5 py-2.5 text-sm transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {cat.icon}
                </div>
                <span className="whitespace-nowrap overflow-hidden text-xs font-medium opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200">
                  {cat.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Secondary Sidebar: Contextual Sub-navigation (Full Width, Text) ── */}
      <div className="flex h-full w-56 flex-col border-r border-border bg-card p-3 overflow-y-auto">
        <div className="flex flex-col gap-3 pb-3 border-b border-border/60">
          <Link
            href={renderUrl('')}
            className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Organization</span>
          </Link>
          <ProjectSelect
            projectId={projectId}
            organizationId={organizationId}
            onChange={handleProjectChange}
          />
            {HAS_BILLING && <BillingAlertIcon variant="sidebar" />}
        </div>

        {/* Category Header */}
        <div className="pt-4 pb-2 px-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {activeCategory.label}
          </span>
        </div>

        {/* Options present in that category */}
        <nav className="flex flex-col gap-1">
          {activeCategory.items.map((item) => {
            const active = isItemActive(item.path);
            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={onItemClick}
                className={cn(
                  'flex items-center rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
