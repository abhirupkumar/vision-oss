'use client';
import { useForm } from 'react-hook-form';
import { useLoginQuery, useMessages, useUpdateQuery, useUser } from '@/components/hooks';
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

export function UserEditForm({ userId, onSave }: { userId: string; onSave?: () => void }) {
  const { formatMessage, labels, messages, getMessage } = useMessages();
  const user = useUser();
  const { user: login } = useLoginQuery();

  const { mutateAsync, error, toast, touch } = useUpdateQuery(`/users/${userId}`);

  const form = useForm({
    defaultValues: {
      email: user?.email || '',
      password: '',
      role: user?.role || ROLES.user,
    },
  });

  const handleSubmit = async (data: any) => {
    await mutateAsync(data, {
      onSuccess: async () => {
        toast(formatMessage(messages.saved));
        touch('users');
        if (user?.id) {
          touch(`user:${user.id}`);
        }
        onSave?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {getMessage(error?.code)}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.email)}</FormLabel>
              <FormControl>
                <Input {...field} data-test="input-email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          rules={{
            minLength: { value: 8, message: formatMessage(messages.minPasswordLength, { n: '8' }) },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.password)}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  data-test="input-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {user?.id !== login?.id && (
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
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {formatMessage(labels.save)}
          </Button>
        </div>
      </form>
    </Form>
  );
}
