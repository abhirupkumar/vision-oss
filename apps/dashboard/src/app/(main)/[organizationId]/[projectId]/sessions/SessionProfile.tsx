import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/common/Avatar';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { useMessages, useProjectSessionQuery } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { ReplayModal } from '@/app/(main)/[organizationId]/[projectId]/replays/ReplayModal';
import { ReplaysDataTable } from '@/app/(main)/[organizationId]/[projectId]/replays/ReplaysDataTable';
import { ReplaysTable } from '@/app/(main)/[organizationId]/[projectId]/replays/ReplaysTable';
import { SessionActivity } from './SessionActivity';
import { SessionData } from './SessionData';
import { SessionInfo } from './SessionInfo';
import { SessionStats } from './SessionStats';

export function SessionProfile({
  projectId,
  sessionId,
  onClose,
}: {
  projectId: string;
  sessionId: string;
  onClose?: () => void;
}) {
  const { data, isLoading, error } = useProjectSessionQuery(projectId, sessionId);
  const { formatMessage, labels, messages } = useMessages();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(data?.id);
    toast('Copied!');
  };

  return (
    <LoadingPanel data={data} isLoading={isLoading} error={error} minHeight="400px">
      {data && (
        <div className="flex flex-col gap-4">
          {onClose && (
            <div className="flex justify-end">
              <Button onClick={onClose} variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
              <Avatar seed={data?.sessionId} size={128} />
              <div className="w-full max-w-[360px] space-y-2">
                <Label>Session ID</Label>
                <div className="flex gap-2">
                  <Input value={data?.id} readOnly className="bg-muted font-mono text-xs" />
                  <Button variant="outline" onClick={handleCopy}>
                    {formatMessage(labels.copy)}
                  </Button>
                </div>
              </div>
            </div>

            <SessionStats data={data} />
            <SessionInfo data={data} />

            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="activity">{formatMessage(labels.activity)}</TabsTrigger>
                <TabsTrigger value="replays">Replays</TabsTrigger>
                <TabsTrigger value="properties">{formatMessage(labels.properties)}</TabsTrigger>
              </TabsList>
              <TabsContent value="activity">
                <SessionActivity
                  projectId={projectId}
                  sessionId={sessionId}
                  startDate={data?.firstAt}
                  endDate={data?.lastAt}
                />
              </TabsContent>
              <TabsContent value="replays">
                <ReplaysDataTable projectId={projectId} params={{ sessionId }}>
                  {({ data }) => (
                    <ReplaysTable data={data} onSelect={setSelectedSessionId} />
                  )}
                </ReplaysDataTable>
              </TabsContent>
              <TabsContent value="properties">
                <SessionData
                  sessionId={data?.visitorId || data?.sessionId || data?.id}
                  projectId={projectId}
                />
              </TabsContent>
            </Tabs>
          </div>

          {selectedSessionId && (
            <ReplayModal
              projectId={projectId}
              sessionId={selectedSessionId}
              open={!!selectedSessionId}
              onClose={() => setSelectedSessionId(null)}
            />
          )}
        </div>
      )}
    </LoadingPanel>
  );
}
