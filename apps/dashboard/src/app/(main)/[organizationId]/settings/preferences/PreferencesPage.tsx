'use client';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useMessages } from '@/components/hooks';
import { Settings2 } from 'lucide-react';
import { PreferenceSettings } from './PreferenceSettings';

export function PreferencesPage() {
  const { formatMessage, labels } = useMessages();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={formatMessage(labels.preferences)}
        description="Customize your workspace display, language, timezone, and appearance."
        icon={<Settings2 className="h-5 w-5" />}
      />
      <Panel>
        <PreferenceSettings />
      </Panel>
    </div>
  );
}
