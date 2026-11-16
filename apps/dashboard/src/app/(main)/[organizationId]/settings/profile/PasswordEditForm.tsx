'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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

export function PasswordEditForm({ onSave, onClose }) {
  const { formatMessage, labels, messages, getErrorMessage } = useMessages();
  const { mutateAsync, error, isPending } = useUpdateQuery('/me/password');

  const formSchema = z
    .object({
      currentPassword: z.string().min(1, 'Required'),
      newPassword: z.string().min(8, formatMessage(messages.minPasswordLength, { n: '8' })),
      confirmPassword: z.string().min(8, formatMessage(messages.minPasswordLength, { n: '8' })),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: formatMessage(messages.noMatchPassword),
      path: ['confirmPassword'],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    await mutateAsync(data, {
      onSuccess: () => {
        onSave();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {error && (
          <div className="text-sm font-medium text-destructive">{getErrorMessage(error)}</div>
        )}

        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.currentPassword)}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.newPassword)}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.confirmPassword)}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="confirm-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
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
