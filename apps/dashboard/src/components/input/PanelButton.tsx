import { useGlobalState } from '@/components/hooks';
import { PanelLeft } from '@/components/icons';

export function PanelButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [isCollapsed, setIsCollapsed] = useGlobalState('sidenav-collapsed');
  return (
    <button
      type="button"
      onClick={() => setIsCollapsed(!isCollapsed)}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors p-0"
      {...props}
    >
      <span className="h-4 w-4">
        <PanelLeft />
      </span>
    </button>
  );
}
