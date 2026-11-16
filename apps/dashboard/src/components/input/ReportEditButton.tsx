'use client';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useMessages } from '@/components/hooks';
import { useDeleteQuery } from '@/components/hooks/queries/useDeleteQuery';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ReportEditButton({
  id,
  name,
  type,
  children,
  onDelete,
}: {
  id: string;
  name: string;
  type: string;
  onDelete?: () => void;
  children: ({ close }: { close: () => void }) => ReactNode;
}) {
  const { formatMessage, labels, messages } = useMessages();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const { mutateAsync, touch } = useDeleteQuery(`/reports/${id}`);

  const handleDelete = async () => {
    await mutateAsync(null, {
      onSuccess: async () => {
        touch(`reports:${type}`);
        setShowDelete(false);
        onDelete?.();
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Pencil className="mr-2 size-4" />
            <span>{formatMessage(labels.edit)}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDelete(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            <span>{formatMessage(labels.delete)}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{formatMessage(labels.edit)}</DialogTitle>
          </DialogHeader>
          {children({ close: () => setShowEdit(false) })}
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{formatMessage(labels.delete)}</AlertDialogTitle>
            <AlertDialogDescription>
              {formatMessage(messages.confirmDelete, { target: name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{formatMessage(labels.cancel)}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {formatMessage(labels.delete)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
