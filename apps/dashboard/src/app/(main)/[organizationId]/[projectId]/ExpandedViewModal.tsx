'use client';
import { ProjectExpandedView } from '@/app/(main)/[organizationId]/[projectId]/ProjectExpandedView';
import { useMobile, useNavigation } from '@/components/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ExpandedViewModal({
  projectId,
  excludedIds,
}: {
  projectId: string;
  excludedIds?: string[];
}) {
  const {
    router,
    query: { view },
    updateParams,
  } = useNavigation();
  const { isMobile } = useMobile();

  const handleClose = () => {
    router.push(updateParams({ view: undefined }));
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose();
    }
  };

  return (
    <Dialog open={!!view} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[95vw] sm:max-w-[95vw] md:max-w-[95vw] lg:max-w-[1320px] max-w-[1320px] h-[92vh] max-h-[92vh] p-0 overflow-hidden flex flex-col"
        style={{ width: '95vw', maxWidth: '1320px', height: '92vh', maxHeight: '92vh' }}
        onInteractOutside={e => e.preventDefault()} // Keep behavior consistent if needed
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Project Expanded View</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-6">
          <ProjectExpandedView
            projectId={projectId}
            excludedIds={excludedIds}
            onClose={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
