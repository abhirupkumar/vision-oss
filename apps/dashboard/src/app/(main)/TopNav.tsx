import { LanguageButton } from '@/components/input/LanguageButton';
import { ProfileButton } from '@/components/input/ProfileButton';
import { ThemeSetting } from './settings/preferences/ThemeSetting';

export function TopNav() {
  return (
    <div className="sticky top-0 z-10 flex w-full items-center justify-end px-5 py-2">
      <div className="flex items-center justify-end gap-1 rounded-md bg-background/80 backdrop-blur-sm px-1">
        <ThemeSetting />
        <LanguageButton />
        <ProfileButton />
      </div>
    </div>
  );
}
