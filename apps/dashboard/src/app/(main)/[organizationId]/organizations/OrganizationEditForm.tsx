'use client';
import { RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useMessages, useOrganization, useUpdateQuery } from '@/components/hooks';
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
import { getRandomChars } from '@/lib/generate';

const generateId = () => `organization_${getRandomChars(16)}`;

export function OrganizationEditForm({
  organizationId,
  allowEdit,
  showAccessCode,
  onSave,
}: {
  organizationId: string;
  allowEdit?: boolean;
  showAccessCode?: boolean;
  onSave?: () => void;
}) {
  const organization: any = useOrganization();
  const { formatMessage, labels, messages, getErrorMessage } = useMessages();
  const { mutateAsync, error, isPending, touch } = useUpdateQuery(
    `/organizations/${organizationId}`,
  );

  const form = useForm({
    defaultValues: {
      id: organization?.id || '',
      name: organization?.name || '',
      accessCode: organization?.accessCode || '',
    },
  });

  const handleSubmit = async (data: any) => {
    await mutateAsync(data, {
      onSuccess: async () => {
        toast(formatMessage(messages.saved));
        touch('organizations');
        touch(`organizations:${organizationId}`);
        onSave?.();
      },
    });
  };

  const handleRegenerate = () => {
    form.setValue('accessCode', generateId(), { shouldDirty: true });
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast('Copied!');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {getErrorMessage(error)}
          </div>
        )}

        <div className="space-y-2">
          <FormLabel>{formatMessage(labels.organizationId)}</FormLabel>
          <div className="flex gap-2">
            <Input value={organization?.id} readOnly className="bg-muted font-mono text-xs" />
            <Button type="button" variant="outline" onClick={() => handleCopy(organization?.id)}>
              {formatMessage(labels.copy)}
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          rules={{ required: formatMessage(labels.required) }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.name)}</FormLabel>
              <FormControl>
                <Input {...field} readOnly={!allowEdit} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showAccessCode && (
          <div className="space-y-2">
            <FormLabel>{formatMessage(labels.accessCode)}</FormLabel>
            <div className="flex gap-2">
              <div className="flex-1 relative group">
                <Input
                  value={form.watch('accessCode')}
                  readOnly
                  className="bg-muted font-mono text-xs pr-16"
                />
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleCopy(form.watch('accessCode'))}
                >
                  {formatMessage(labels.copy)}
                </Button>
              </div>
              {allowEdit && (
                <Button type="button" variant="outline" onClick={handleRegenerate}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {formatMessage(labels.regenerate)}
                </Button>
              )}
            </div>
          </div>
        )}

        {allowEdit && (
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending || !form.formState.isDirty}>
              {formatMessage(labels.save)}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
