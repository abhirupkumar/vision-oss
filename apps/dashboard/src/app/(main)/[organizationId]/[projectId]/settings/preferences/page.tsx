import type { Metadata } from 'next';
import { PreferencesPage } from '@/app/(main)/[organizationId]/settings/preferences/PreferencesPage';

export default function Page() {
  return <PreferencesPage />;
}

export const metadata: Metadata = {
  title: 'Preferences',
};
