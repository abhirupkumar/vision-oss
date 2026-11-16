export function ABTestStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    running: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    stopped: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[status] ?? colors.draft}`}
    >
      {status}
    </span>
  );
}
