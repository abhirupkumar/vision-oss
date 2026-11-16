'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMessages, useProjectSegmentQuery, useUpdateQuery } from '@/components/hooks';
import { FieldFilters } from '@/components/input/FieldFilters';
import { messages } from '@/components/messages';
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
import { Spinner } from '@/components/ui/spinner';

export function SegmentEditForm({
  segmentId,
  projectId,
  filters = [],
  showFilters = true,
  onSave,
  onClose,
}: {
  segmentId?: string;
  projectId: string;
  filters?: any[];
  showFilters?: boolean;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { data } = useProjectSegmentQuery(projectId, segmentId);
  const { formatMessage, labels, getErrorMessage } = useMessages();

  const { mutateAsync, error, isPending, touch, toast } = useUpdateQuery(
    `/projects/${projectId}/segments${segmentId ? `/${segmentId}` : ''}`,
    {
      type: 'segment',
    },
  );

  const form = useForm({
    defaultValues: data || { name: '', parameters: { filters } },
  });

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const onSubmit = async (formData: any) => {
    await mutateAsync(formData, {
      onSuccess: async () => {
        toast(formatMessage(messages.saved));
        touch('segments');
        onSave?.();
        onClose?.();
      },
    });
  };

  if (segmentId && !data) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8 py-2">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: formatMessage(labels.required) }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.name)}</FormLabel>
              <FormControl>
                <Input placeholder="Segment name" autoFocus={!segmentId} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showFilters && (
          <FormField
            control={form.control}
            name="parameters.filters"
            rules={{ required: formatMessage(labels.required) }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{formatMessage(labels.filters)}</FormLabel>
                <FormControl>
                  <FieldFilters
                    projectId={projectId}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {error && (
          <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
            {getErrorMessage(error)}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <Button type="button" variant="ghost" disabled={isPending} onClick={onClose}>
            {formatMessage(labels.cancel)}
          </Button>
          <Button type="submit" disabled={isPending} className="min-w-[100px]">
            {isPending && <Spinner size={16} className="mr-2" />}
            {formatMessage(labels.save)}
          </Button>
        </div>
      </form>
    </Form>
  );
}
