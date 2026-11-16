'use client';
import { useUser } from '@clerk/nextjs';
import { format } from 'date-fns';
import {
  Calendar,
  Globe,
  Lock,
  Mail,
  MoreHorizontal,
  Plus,
  Settings2,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { DataGrid } from '@/components/common/DataGrid';
import { PageHeader } from '@/components/common/PageHeader';
import { useOrganizationInvitesQuery } from '@/components/hooks/queries/useOrganizationInvitesQuery';
import { useOrganizationMembersQuery } from '@/components/hooks/queries/useOrganizationMembersQuery';
import { useApi } from '@/components/hooks/useApi';
import { useModified } from '@/components/hooks/useModified';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { EditAccessModal } from './EditAccessModal';
import { InviteUserModal } from './InviteUserModal';

export function MembersPage() {
  const { user: currentUser } = useUser();
  const params = useParams();
  const organizationId = params.organizationId as string;
  const [activeTab, setActiveTab] = useState('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const membersQuery = useOrganizationMembersQuery(organizationId);
  const invitesQuery = useOrganizationInvitesQuery(organizationId);

  const currentUserRole = membersQuery.data?.data?.find(
    (m: any) => m.user?.clerkId === currentUser?.id,
  )?.role;

  const { del } = useApi();
  const { touch } = useModified(`organizations:members`);

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await del(`/organizations/${organizationId}/users/${userId}`);
        toast.success('Member removed successfully');
        touch('organizations:members');
      } catch (e: any) {
        toast.error(e.message || 'Failed to remove member');
      }
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (confirm('Are you sure you want to revoke this invitation?')) {
      try {
        await del(`/organizations/${organizationId}/invites/${inviteId}`);
        toast.success('Invitation revoked');
        touch('organizations:invites');
      } catch (e: any) {
        toast.error(e.message || 'Failed to revoke invitation');
      }
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto px-4 pb-8 pt-0 md:px-6">
      <div className="mx-auto max-w-[1320px]">
        <PageHeader
          title="Members"
          description="Manage your team members and their project-level permissions."
          icon={<Users size={20} />}
        >
          {(currentUserRole === 'admin' || currentUserRole === 'owner') && (
            <Button onClick={() => setShowInviteModal(true)} className="gap-2">
              <Plus size={16} /> Invite user
            </Button>
          )}
        </PageHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="members" className="mt-0 border-none p-0 outline-none">
            <DataGrid query={membersQuery} allowSearch>
              {({ data }) => (
                <div className="rounded-md border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead>Joined At</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((member: any) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                {(member.user?.displayName ||
                                  member.user?.email ||
                                  '?')[0].toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="truncate text-sm font-medium">
                                  {member.user?.displayName || 'N/A'}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                  {member.user?.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-xs">
                              {member.projectAccess?.length === 0 ? (
                                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                  <Globe size={12} /> Full access
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-amber-600 font-medium">
                                  <Lock size={12} /> {member.projectAccess?.length} projects
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {member.createdAt
                              ? format(new Date(member.createdAt), 'MMM d, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {(() => {
                              const isSelf = member.user?.clerkId === currentUser?.id;
                              const targetRole = member.role;

                              let canEdit = false;
                              if (!isSelf) {
                                if (currentUserRole === 'owner') {
                                  canEdit = targetRole === 'admin' || targetRole === 'member';
                                } else if (currentUserRole === 'admin') {
                                  canEdit = targetRole === 'member';
                                }
                              }

                              if (!canEdit) return null;

                              return (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal size={16} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      className="gap-2"
                                      onClick={() => setEditingMember(member)}
                                    >
                                      <Settings2 size={14} /> Edit access
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="gap-2 text-destructive focus:text-destructive"
                                      onClick={() => handleRemoveMember(member.id, member.userId)}
                                    >
                                      <Trash2 size={14} /> Remove user
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </DataGrid>
          </TabsContent>

          <TabsContent value="invitations" className="mt-0 border-none p-0 outline-none">
            <DataGrid query={invitesQuery} allowSearch>
              {({ data }) => (
                <div className="rounded-md border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Recipient</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((invite: any) => (
                        <TableRow key={invite.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{invite.email}</span>
                              <span className="text-[10px] text-muted-foreground">
                                ID: {invite.id.slice(0, 8)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {invite.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-xs">
                              {invite.projectAccess?.length === 0 ? (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Globe size={12} /> Full access
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Lock size={12} /> {invite.projectAccess?.length} projects
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {invite.createdAt
                              ? format(new Date(invite.createdAt), 'MMM d, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {(() => {
                              const targetRole = invite.role;
                              let canRevoke = false;

                              if (currentUserRole === 'owner') {
                                canRevoke = targetRole === 'admin' || targetRole === 'member';
                              } else if (currentUserRole === 'admin') {
                                canRevoke = targetRole === 'member';
                              }

                              if (!canRevoke) return null;

                              return (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal size={16} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      className="gap-2 text-destructive focus:text-destructive"
                                      onClick={() => handleRevokeInvite(invite.id)}
                                    >
                                      <Trash2 size={14} /> Revoke invite
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </DataGrid>
          </TabsContent>
        </Tabs>

        {showInviteModal && (
          <InviteUserModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            organizationId={organizationId}
            onSuccess={() => {
              touch('organizations:invites');
              setShowInviteModal(false);
            }}
          />
        )}

        {editingMember && (
          <EditAccessModal
            isOpen={!!editingMember}
            onClose={() => setEditingMember(null)}
            organizationId={organizationId}
            member={editingMember}
            currentUserRole={currentUserRole}
            onSuccess={() => {
              touch('organizations:members');
              setEditingMember(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
