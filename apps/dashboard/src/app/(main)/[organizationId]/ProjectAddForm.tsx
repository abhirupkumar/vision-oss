'use client';
import { debounce } from 'lodash';
import { useCallback, useState } from 'react';
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
import { DOMAIN_REGEX } from '@/lib/constants';
import { slugify } from '@/lib/generate';

export function ProjectAddForm({
  organizationId,
  onSave,
  onClose,
}: {
  organizationId?: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { formatMessage, labels, messages, getErrorMessage } = useMessages();
  const { mutateAsync, error, isPending } = useUpdateQuery('/projects', { organizationId });

  const form = useForm({
    defaultValues: {
      name: '',
      domain: '',
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
          name="name"
          rules={{ required: formatMessage(labels.required) }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.name)}</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="domain"
          rules={{
            required: formatMessage(labels.required),
            pattern: { value: DOMAIN_REGEX, message: formatMessage(messages.invalidDomain) },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.domain)}</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" placeholder="example.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          {onClose && (
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              {formatMessage(labels.cancel)}
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {formatMessage(labels.save)}
          </Button>
        </div>
      </form>
    </Form>
  );
}
