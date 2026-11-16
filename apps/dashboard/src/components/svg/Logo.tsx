import type { SVGProps } from 'react';
import * as React from 'react';

export interface LogoProps extends SVGProps<SVGSVGElement> {
  mode?: 'light' | 'dark' | 'auto';
}

const SvgLogo = ({ mode = 'auto', className = '', ...props }: LogoProps) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 683" className={className} {...props}>
      {mode === 'dark' ? (
        <image href="/logo-white.png" width="1024" height="683" />
      ) : mode === 'light' ? (
        <image href="/logo-black.png" width="1024" height="683" />
      ) : (
        <>
          <image href="/logo-black.png" width="1024" height="683" className="block dark:hidden" />
          <image href="/logo-white.png" width="1024" height="683" className="hidden dark:block" />
        </>
      )}
    </svg>
  );
};
export default SvgLogo;
