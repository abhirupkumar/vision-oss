import { ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { SideMenu } from '@/components/common/SideMenu';
import { useMessages, useNavigation } from '@/components/hooks';
import { Globe, Settings2, UserCircle, Users } from '@/components/icons';

export function SettingsNav({ onItemClick }: { onItemClick?: () => void }) {
  const { formatMessage, labels } = useMessages();
  const { renderUrl, pathname } = useNavigation();

  const items = [
    {
      label: formatMessage(labels.application),
      items: [
        {
          id: 'preferences',
          label: formatMessage(labels.preferences),
          path: renderUrl('/settings/preferences'),
          icon: <Settings2 />,
        },
      ],
    },
    {
      label: formatMessage(labels.account),
      items: [
        {
          id: 'profile',
          label: formatMessage(labels.profile),
          path: renderUrl('/settings/profile'),
          icon: <UserCircle />,
        },
        {
          id: 'organization',
          label: formatMessage(labels.organization),
          path: renderUrl('/settings'),
          icon: <Users />,
        },
        {
          id: 'billing',
          label: 'Billing & Usage',
          path: renderUrl('/settings/billing'),
          icon: <CreditCard size={18} />,
        },
      ],
    },
  ];

  const selectedKey = items
    .flatMap(e => e.items)
    .find(({ path }) => path && pathname.includes(path.split('?')[0]))?.id;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={renderUrl('')}
        className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        <span>Back to Organization</span>
      </Link>
      <SideMenu
        items={items}
        title={formatMessage(labels.settings)}
        selectedKey={selectedKey}
        allowMinimize={false}
        onItemClick={onItemClick}
      />
    </div>
  );
}
