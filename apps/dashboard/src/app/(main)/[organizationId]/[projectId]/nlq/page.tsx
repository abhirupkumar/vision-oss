import { ChatSurface } from '@/components/ai/ChatSurface';

export default async function NlqPage({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 pb-12 w-full max-w-4xl mx-auto h-full">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <span className="text-primary">🤖</span> Ask AI
            </h1>
            <p className="text-sm text-muted-foreground">
              Explore your data, create funnels, and analyze user behavior using natural language.
            </p>
          </div>
        </div>
        
        <div className="flex-1 h-full min-h-[500px]">
          <ChatSurface projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
