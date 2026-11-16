import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Logo from '@/components/svg/Logo';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Logo className="w-4 h-4" />
          <b>vision</b>
        </>
      ),
      url: '/',
    },
  };
}
