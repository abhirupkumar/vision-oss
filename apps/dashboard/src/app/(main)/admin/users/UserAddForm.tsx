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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLES } from '@/lib/constants';

export function UserAddForm({ onSave, onClose }) {
  const { mutateAsync, error, isPending } = useUpdateQuery(`/users`);
  const { formatMessage, labels, getErrorMessage } = useMessages();

  const form = useForm({
    defaultValues: {
      email: '',
      clerkId: '',
      password: '',
      role: ROLES.user,
    },
  });

  const handleSubmit = async (data: any) => {
    await mutateAsync(data, {
      onSuccess: async () => {
        onSave(data);
        onClose();
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
          name="email"
          rules={{ required: formatMessage(labels.required) }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.email)}</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clerkId"
          rules={{ required: formatMessage(labels.required) }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clerk ID</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          rules={{ required: formatMessage(labels.required) }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.password)}</FormLabel>
              <FormControl>
                <Input {...field} type="password" autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  <SelectItem value={ROLES.viewOnly}>{formatMessage(labels.viewOnly)}</SelectItem>
                  <SelectItem value={ROLES.user}>{formatMessage(labels.user)}</SelectItem>
                  <SelectItem value={ROLES.admin}>{formatMessage(labels.admin)}</SelectItem>
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
