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

export function OrganizationJoinForm({
  onSave,
  onClose,
}: {
  onSave: () => void;
  onClose: () => void;
}) {
  const { formatMessage, labels, getErrorMessage } = useMessages();
  const { mutateAsync, error, touch, isPending } = useUpdateQuery('/organizations/join');

  const form = useForm({
    defaultValues: {
      accessCode: '',
    },
  });

  const handleSubmit = async (data: any) => {
    await mutateAsync(data, {
      onSuccess: async () => {
        touch('organizations:members');
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
          name="accessCode"
          rules={{ required: formatMessage(labels.required) }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.accessCode)}</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            {formatMessage(labels.cancel)}
          </Button>
          <Button type="submit" disabled={isPending}>
            {formatMessage(labels.join)}
          </Button>
        </div>
      </form>
    </Form>
  );
}
