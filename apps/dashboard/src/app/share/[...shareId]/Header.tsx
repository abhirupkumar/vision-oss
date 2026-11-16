import Link from 'next/link';
import { ThemeSetting } from '@/app/(main)/[organizationId]/settings/preferences/ThemeSetting';
import { LanguageButton } from '@/components/input/LanguageButton';
import { PreferencesButton } from '@/components/input/PreferencesButton';
import { Logo } from '@/components/svg';

export function Header() {
  return (
    <header className="flex flex-row items-center justify-between py-3 border-b border-border/60 px-4">
      <Link href="/" className="flex flex-row items-center gap-2.5 group">
        <span className="h-7 w-7 flex items-center justify-center">
          <Logo className="h-6 w-auto" />
        </span>
        <span className="font-semibold text-lg tracking-tight">Vision</span>
      </Link>
      <div className="flex flex-row items-center gap-2">
        <ThemeSetting />
        <LanguageButton />
        <PreferencesButton />
      </div>
    </header>
  );
}
