'use client';
import { useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ChevronDown,
  Crown,
  Plus,
  Save,
  Search,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useOrganizationProjectsQuery } from '@/components/hooks/queries/useOrganizationProjectsQuery';
import { useApi } from '@/components/hooks/useApi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const editAccessSchema = z.object({
  role: z.enum(['member', 'admin', 'owner']),
  restrictAccess: z.boolean().default(false),
  projectIds: z.array(z.string()).default([]),
});

type EditAccessFormValues = z.infer<typeof editAccessSchema>;

interface EditAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  member: any;
  currentUserRole?: string;
  onSuccess: () => void;
}

export function EditAccessModal({
  isOpen,
  onClose,
  organizationId,
  member,
  currentUserRole,
  onSuccess,
}: EditAccessModalProps) {
  const { post } = useApi();
  const { user: currentUser } = useUser();
  const projectsQuery = useOrganizationProjectsQuery(organizationId);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<EditAccessFormValues>({
    resolver: zodResolver(editAccessSchema) as any,
    defaultValues: {
      role: member?.role || 'member',
      restrictAccess: member?.projectAccess && member.projectAccess.length > 0,
      projectIds: member?.projectAccess?.map((pa: any) => pa.projectId) || [],
    },
  });

  // Watch values at top level for conditional UI
  const restrictAccess = useWatch({ control: form.control, name: 'restrictAccess' });
  const projectIds = useWatch({ control: form.control, name: 'projectIds' }) || [];

  const isSelf = currentUser?.id === member?.user?.clerkId;
  const isOwner = member?.role === 'owner';
  const targetRole = member?.role;

  const canEdit = useMemo(() => {
    if (isSelf) return false;
    if (currentUserRole === 'owner') {
      return targetRole === 'admin' || targetRole === 'member';
    }
    if (currentUserRole === 'admin') {
      return targetRole === 'member';
    }
    return false;
  }, [isSelf, currentUserRole, targetRole]);

  const isProtected = !canEdit;

  const protectionReason = useMemo(() => {
    if (isSelf) return 'You cannot edit your own organization access.';
    if (isOwner) return 'Organization owners cannot have their access modified.';
    if (currentUserRole === 'admin' && targetRole === 'admin')
      return 'Admins cannot modify access for other admins.';
    if (currentUserRole === 'member') return 'Members do not have permission to modify access.';
    return 'You do not have permission to edit this member.';
  }, [isSelf, isOwner, currentUserRole, targetRole]);

  // Use a stable reference for the reset logic to prevent infinite loops
  useEffect(() => {
    if (isOpen && member) {
      form.reset({
        role: member.role || 'member',
        restrictAccess: member.projectAccess && member.projectAccess.length > 0,
        projectIds: member.projectAccess?.map((pa: any) => pa.projectId) || [],
      });
    }
  }, [isOpen, member?.userId, member?.role, form]);

  const onSubmit = async (values: EditAccessFormValues) => {
    if (isProtected) {
      toast.error(protectionReason);
      return;
    }
    try {
      await post(`/organizations/${organizationId}/users/${member.userId}`, {
        role: values.role,
        projectAccess: values.restrictAccess ? values.projectIds : [],
      });
      toast.success('Access updated successfully');
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update access');
    }
  };

  const filteredProjects = useMemo(() => {
    return (
      projectsQuery.data?.data?.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ) || []
    );
  }, [projectsQuery.data, searchQuery]);

  const handleToggleProject = useCallback(
    (projectId: string, checked: boolean) => {
      const currentIds = form.getValues('projectIds') || [];
      const hasProject = currentIds.includes(projectId);
      if (checked && !hasProject) {
        form.setValue('projectIds', [...currentIds, projectId], {
          shouldDirty: true,
          shouldValidate: true,
        });
      } else if (!checked && hasProject) {
        form.setValue(
          'projectIds',
          currentIds.filter(id => id !== projectId),
          { shouldDirty: true, shouldValidate: true },
        );
      }
    },
    [form],
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md bg-background border-l border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit access</SheetTitle>
          <SheetDescription>
            Modify permissions for{' '}
            <span className="font-semibold text-foreground">
              {member?.user?.displayName || member?.user?.email}
            </span>
            .
          </SheetDescription>
        </SheetHeader>

        {isProtected && (
          <div className="pt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Protected</AlertTitle>
              <AlertDescription>{protectionReason}</AlertDescription>
            </Alert>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isProtected}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">
                        <div className="flex flex-col">
                          <span className="font-medium flex items-center gap-2">
                            <UserIcon size={14} /> Member
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            Standard access to selected projects.
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex flex-col">
                          <span className="font-medium flex items-center gap-2">
                            <Shield size={14} /> Admin
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            Full access to all projects and settings.
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Project Restrictions</Label>
              <div className="space-y-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={isProtected}>
                    <Button
                      variant="outline"
                      className="w-full justify-between disabled:opacity-70"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            restrictAccess ? 'bg-amber-500' : 'bg-emerald-500',
                          )}
                        />
                        {restrictAccess ? 'Restricted access' : 'Full access to all projects'}
                      </div>
                      <ChevronDown size={14} className="text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[calc(var(--radix-dropdown-menu-trigger-width))]">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => form.setValue('restrictAccess', false)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">All projects</span>
                        <span className="text-xs text-muted-foreground">
                          Grant access to all current and future projects.
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => form.setValue('restrictAccess', true)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">Restrict access to projects</span>
                        <span className="text-xs text-muted-foreground">
                          Manually select which projects the user can see.
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {restrictAccess && (
                  <div className="rounded-md border border-border bg-card overflow-hidden shadow-sm">
                    <div className="relative border-b border-border">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        placeholder="Search projects..."
                        className="h-9 pl-9 border-none focus-visible:ring-0 text-sm bg-transparent"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        disabled={isProtected}
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                      {filteredProjects.map((project: any) => {
                        const isSelected = projectIds.includes(project.id);
                        return (
                          <div
                            key={project.id}
                            className={cn(
                              'flex items-center space-x-3 rounded-sm p-2 transition-colors',
                              isSelected
                                ? 'bg-primary/5 hover:bg-primary/10'
                                : 'hover:bg-accent',
                              !isProtected && 'cursor-pointer',
                            )}
                            onClick={(e) => {
                              if (!e.isTrusted || isProtected) return;
                              handleToggleProject(project.id, !isSelected);
                            }}
                          >
                            <Checkbox
                              id={`project-${project.id}`}
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={checked =>
                                !isProtected && handleToggleProject(project.id, !!checked)
                              }
                              disabled={isProtected}
                            />
                            <span
                              className={cn(
                                'text-sm font-medium leading-none flex-1 select-none',
                                !isProtected && 'cursor-pointer',
                              )}
                            >
                              {project.name}
                            </span>
                          </div>
                        );
                      })}
                      {filteredProjects.length === 0 && (
                        <div className="py-8 text-center">
                          <p className="text-xs text-muted-foreground">
                            No projects found matching "{searchQuery}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose}>
                {isProtected ? 'Close' : 'Cancel'}
              </Button>
              {!isProtected && (
                <Button type="submit" className="gap-2">
                  <Save size={14} /> Save changes
                </Button>
              )}
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
