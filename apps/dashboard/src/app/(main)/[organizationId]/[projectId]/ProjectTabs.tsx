import Link from 'next/link';
import { useMessages, useNavigation, useProject } from '@/components/hooks';
import { ChartPie, Clock, Eye, User } from '@/components/icons';
import { Lightning } from '@/components/svg';
import { cn } from '@/lib/utils';

export function ProjectTabs() {
  const project = useProject();
  const { pathname, renderUrl } = useNavigation();
  const { formatMessage, labels } = useMessages();

  const links = [
    {
      id: 'overview',
      label: formatMessage(labels.overview),
      icon: <Eye />,
      path: '',
    },
    {
      id: 'events',
      label: formatMessage(labels.events),
      icon: <Lightning />,
      path: '/events',
    },
    {
      id: 'sessions',
      label: formatMessage(labels.sessions),
      icon: <User />,
      path: '/sessions',
    },
    {
      id: 'realtime',
      label: formatMessage(labels.realtime),
      icon: <Clock />,
      path: '/realtime',
    },
    {
      id: 'reports',
      label: formatMessage(labels.reports),
      icon: <ChartPie />,
      path: '/reports',
    },
  ];

  const selectedKey = links.find(({ path }) => path && pathname.includes(path))?.id || 'overview';

  return (
    <nav className="flex flex-row items-center gap-1 mb-6 border-b border-border pb-px overflow-x-auto hide-scrollbar">
      {links.map(({ id, label, icon, path }) => {
        const isActive = selectedKey === id;
        return (
          <Link
            key={id}
            href={renderUrl(`/${project.id}${path}`)}
            className={cn(
              'relative flex flex-row items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
              'hover:text-foreground focus-visible:outline-none',
              isActive
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                : 'text-muted-foreground',
            )}
          >
            <span className="h-4 w-4 shrink-0">{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
