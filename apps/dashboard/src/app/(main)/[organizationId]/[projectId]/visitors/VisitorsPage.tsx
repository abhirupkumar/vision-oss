'use client';
import { UserCheck, UserX } from 'lucide-react';
import { ProjectControls } from '@/app/(main)/[organizationId]/[projectId]/ProjectControls';
import { Panel } from '@/components/common/Panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisitorsDataTable } from './VisitorsDataTable';

export function VisitorsPage({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-col gap-3">
      <ProjectControls projectId={projectId} />
      <Panel>
        <Tabs defaultValue="identified" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="identified" className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5" />
              Identified
            </TabsTrigger>
            <TabsTrigger value="anonymous" className="flex items-center gap-1.5">
              <UserX className="h-3.5 w-3.5" />
              Anonymous
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identified" className="mt-0">
            <VisitorsDataTable projectId={projectId} identified={true} />
          </TabsContent>

          <TabsContent value="anonymous" className="mt-0">
            <VisitorsDataTable projectId={projectId} identified={false} />
          </TabsContent>
        </Tabs>
      </Panel>
    </div>
  );
}
