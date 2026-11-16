import { Fragment } from 'react';
import { useMessages, useNavigation } from '@/components/hooks';
import { Edit, Ellipsis, Share2 } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ProjectMenu({ projectId }: { projectId: string }) {
  const { formatMessage, labels } = useMessages();
  const { router, updateParams, renderUrl } = useNavigation();

  const menuItems = [
    { id: 'share', label: formatMessage(labels.share), icon: <Share2 /> },
    { id: 'edit', label: formatMessage(labels.edit), icon: <Edit />, seperator: true },
  ];

  const handleAction = (id: string) => {
    if (id === 'compare') {
      router.push(updateParams({ compare: 'prev' }));
    } else if (id === 'edit') {
      router.push(renderUrl(`/${projectId}`));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <span className="h-4 w-4">
            <Ellipsis />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {menuItems.map(({ id, label, icon, seperator }, index) => {
          return (
            <Fragment key={index}>
              {seperator && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => handleAction(id)}>
                <span className="mr-2 h-4 w-4 shrink-0 opacity-70">{icon}</span>
                <span>{label}</span>
              </DropdownMenuItem>
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
