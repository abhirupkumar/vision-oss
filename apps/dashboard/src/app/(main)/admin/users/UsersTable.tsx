'use client';
import { Edit, MoreVertical, Trash } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { DateDistance } from '@/components/common/DateDistance';
import { useMessages } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROLES } from '@/lib/constants';
import { UserDeleteForm } from './UserDeleteForm';

export function UsersTable({
  data = [],
  showActions = true,
}: {
  data: any[];
  showActions?: boolean;
}) {
  const { formatMessage, labels } = useMessages();
  const [deleteUser, setDeleteUser] = useState(null);

  return (
    <>
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[2fr]">{formatMessage(labels.email)}</TableHead>
              <TableHead>{formatMessage(labels.role)}</TableHead>
              <TableHead>{formatMessage(labels.projects)}</TableHead>
              <TableHead>{formatMessage(labels.created)}</TableHead>
              {showActions && <TableHead className="w-[100px] text-right"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    href={`/admin/users/${row.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {row.email}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {formatMessage(
                      labels[Object.keys(ROLES).find(key => ROLES[key] === row.role)] ||
                        labels.unknown,
                    )}
                  </span>
                </TableCell>
                <TableCell>{row._count?.projects || 0}</TableCell>
                <TableCell>
                  <DateDistance date={new Date(row.createdAt)} />
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${row.id}`} className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            <span>{formatMessage(labels.edit)}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteUser(row)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          <span>{formatMessage(labels.delete)}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteUser} onOpenChange={open => !open && setDeleteUser(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{formatMessage(labels.deleteUser)}</DialogTitle>
          </DialogHeader>
          <UserDeleteForm
            userId={deleteUser?.id}
            email={deleteUser?.email}
            onClose={() => setDeleteUser(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
