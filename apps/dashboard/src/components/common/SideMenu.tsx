import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

interface SideMenuData {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path: string;
}

interface SideMenuItems {
  label?: string;
  items: SideMenuData[];
}

export interface SideMenuProps {
  items: SideMenuItems[];
  title?: string;
  selectedKey?: string;
  allowMinimize?: boolean;
  onItemClick?: () => void;
}

export function SideMenu({ items = [], title, selectedKey, onItemClick }: SideMenuProps) {
  const pathname = usePathname();

  return (
    <div className="h-full w-full overflow-y-auto hide-scrollbar">
      {title && (
        <div className="mb-4 px-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
      )}
      <nav className="flex flex-col gap-6">
        {items?.map(({ label, items: groupItems }, index) => {
          if (!label) return null;
          return (
            <div key={`${label}${index}`}>
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </div>
              <div className="flex flex-col gap-0.5">
                {groupItems?.map(({ id, label: itemLabel, icon, path }) => {
                  const isSelected = selectedKey ? selectedKey === id : pathname === path;
                  return (
                    <Link
                      key={id}
                      href={path}
                      onClick={onItemClick}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors hover:bg-def-200 text-foreground',
                        isSelected ? 'bg-def-200' : '',
                      )}
                    >
                      {icon && (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                          {icon}
                        </span>
                      )}
                      {itemLabel}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
