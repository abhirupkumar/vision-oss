'use client';
import { useForm } from 'react-hook-form';
import { useMessages, useUpdateQuery } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLES } from '@/lib/constants';

export function OrganizationMemberEditForm({
  organizationId,
  userId,
  role,
  onSave,
  onClose,
}: {
  organizationId: string;
  userId: string;
  role: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { mutateAsync, error, isPending } = useUpdateQuery(
    `/organizations/${organizationId}/users/${userId}`,
  );
  const { formatMessage, labels, getErrorMessage } = useMessages();

  const form = useForm({
    defaultValues: {
      role: role || ROLES.organizationMember,
    },
  });

  const handleSubmit = async (data: any) => {
    await mutateAsync(data, {
      onSuccess: async () => {
        onSave?.();
        onClose?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {getErrorMessage(error)}
          </div>
        )}

        <FormField
          control={form.control}
          name="role"
          rules={{ required: formatMessage(labels.required) }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.role)}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={formatMessage(labels.selectRole)} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">
                    {formatMessage(labels.admin) || 'Admin'}
                  </SelectItem>
                  <SelectItem value="member">
                    {formatMessage(labels.member) || 'Member'}
                  </SelectItem>
                  <SelectItem value={ROLES.organizationManager}>
                    {formatMessage(labels.manager)}
                  </SelectItem>
                  <SelectItem value={ROLES.organizationMember}>
                    {formatMessage(labels.organizationMember) || formatMessage(labels.member)}
                  </SelectItem>
                  <SelectItem value={ROLES.organizationViewOnly}>
                    {formatMessage(labels.viewOnly)}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            {formatMessage(labels.cancel)}
          </Button>
          <Button type="submit" disabled={isPending}>
            {formatMessage(labels.save)}
          </Button>
        </div>
      </form>
    </Form>
  );
}
