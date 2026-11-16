'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Plus, Search, Send, Shield, User as UserIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useOrganizationProjectsQuery } from '@/components/hooks/queries/useOrganizationProjectsQuery';
import { useApi } from '@/components/hooks/useApi';
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

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'admin']),
  restrictAccess: z.boolean().default(false),
  projectIds: z.array(z.string()).default([]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: () => void;
}

export function InviteUserModal({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}: InviteUserModalProps) {
  const { post } = useApi();
  const projectsQuery = useOrganizationProjectsQuery(organizationId);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema) as any,
    defaultValues: {
      email: '',
      role: 'member',
      restrictAccess: false,
      projectIds: [],
    },
  });

  const restrictAccess = useWatch({ control: form.control, name: 'restrictAccess' });
  const projectIds = useWatch({ control: form.control, name: 'projectIds' }) || [];

  const onSubmit = async (values: InviteFormValues) => {
    try {
      await post(`/organizations/${organizationId}/invites`, {
        email: values.email,
        role: values.role,
        projectAccess: values.restrictAccess ? values.projectIds : [],
      });
      toast.success('Invitation sent successfully');
      form.reset();
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || 'Failed to send invitation');
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
        <SheetHeader className="pb-6 border-b border-border">
          <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
            Invite User
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm mt-2">
            Send an invitation to join your organization and set their permissions.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
              <Label className="text-sm font-medium">Project Access</Label>
              <div className="space-y-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
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
                          User will have access to all current and future projects.
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => form.setValue('restrictAccess', true)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">Restrict to specific projects</span>
                        <span className="text-xs text-muted-foreground">
                          Manually choose which projects the user can access.
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {restrictAccess && (
                  <div className="rounded-md border border-border bg-card overflow-hidden">
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
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                      {filteredProjects.map((project: any) => {
                        const isSelected = projectIds.includes(project.id);
                        return (
                          <div
                            key={project.id}
                            className={cn(
                              'flex items-center space-x-3 rounded-sm p-2 transition-colors cursor-pointer',
                              isSelected
                                ? 'bg-primary/5 hover:bg-primary/10'
                                : 'hover:bg-accent',
                            )}
                            onClick={(e) => {
                              if (!e.isTrusted) return;
                              handleToggleProject(project.id, !isSelected);
                            }}
                          >
                            <Checkbox
                              id={`invite-project-${project.id}`}
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={checked =>
                                handleToggleProject(project.id, !!checked)
                              }
                            />
                            <span className="text-sm font-medium leading-none flex-1 select-none">
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
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Send size={14} /> Send Invitation
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
