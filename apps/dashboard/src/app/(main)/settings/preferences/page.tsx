'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginQuery } from '@/components/hooks';

export default function SettingsPreferencesRedirect() {
  const router = useRouter();
  const { user, isLoading } = useLoginQuery();

  useEffect(() => {
    if (!isLoading) {
      const orgId = user?.organizations?.[0]?.id;
      if (orgId) {
        router.replace(`/${orgId}/settings/preferences`);
      } else {
        router.replace('/organizations');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
