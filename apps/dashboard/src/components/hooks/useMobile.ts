import { useEffect, useState } from 'react';

function getBreakpoint(width: number): string {
  if (width < 480) return 'xs';
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
}

export function useMobile() {
  const [breakpoint, setBreakpoint] = useState<string>(() =>
    typeof window !== 'undefined' ? getBreakpoint(window.innerWidth) : 'lg',
  );

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = ['xs', 'sm', 'md'].includes(breakpoint);
  const isPhone = ['xs', 'sm'].includes(breakpoint);

  return { breakpoint, isMobile, isPhone };
}
