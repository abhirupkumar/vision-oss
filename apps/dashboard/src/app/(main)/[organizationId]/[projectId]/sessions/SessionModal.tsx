'use client';
import { SessionProfile } from '@/app/(main)/[organizationId]/[projectId]/sessions/SessionProfile';
import { useNavigation } from '@/components/hooks';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function SessionModal({ projectId }) {
  const {
    router,
    query: { session },
    updateParams,
  } = useNavigation();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      router.push(updateParams({ session: undefined }));
    }
  };

  return (
    <Sheet open={!!session} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90dvh] p-0 sm:h-[80dvh]">
        <SheetHeader className="sr-only">
          <SheetTitle>Session Profile</SheetTitle>
        </SheetHeader>
        <div className="mx-auto w-full max-w-[1320px] h-full overflow-hidden flex flex-col p-6">
          <SessionProfile
            projectId={projectId}
            sessionId={session}
            onClose={() => handleOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
