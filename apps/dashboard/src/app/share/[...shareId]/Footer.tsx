import { CURRENT_VERSION, HOMEPAGE_URL } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="flex flex-row justify-end py-6 text-sm">
      <a href={HOMEPAGE_URL} target="_blank" className="hover:underline">
        <span className="font-bold text-foreground">umami</span>
        <span className="text-muted-foreground ml-1">v{CURRENT_VERSION}</span>
      </a>
    </footer>
  );
}
