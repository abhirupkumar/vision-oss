'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMessages, useProjectCohortQuery, useUpdateQuery } from '@/components/hooks';
import { ActionSelect } from '@/components/input/ActionSelect';
import { DateFilter } from '@/components/input/DateFilter';
import { FieldFilters } from '@/components/input/FieldFilters';
import { LookupField } from '@/components/input/LookupField';
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

export function CohortEditForm({
  cohortId,
  projectId,
  filters = [],
  onSave,
  onClose,
}: {
  cohortId?: string;
  projectId: string;
  filters?: any[];
  showFilters?: boolean;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { data } = useProjectCohortQuery(projectId, cohortId);
  const { formatMessage, labels, messages, getErrorMessage } = useMessages();

  const { mutateAsync, error, isPending, touch, toast } = useUpdateQuery(
    `/projects/${projectId}/segments${cohortId ? `/${cohortId}` : ''}`,
    {
      type: 'cohort',
    },
  );

  const form = useForm({
    defaultValues: data || {
      name: '',
      parameters: { filters, dateRange: '30day', action: { type: 'path', value: '' } },
    },
  });

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const type = form.watch('parameters.action.type');

  const onSubmit = async (formData: any) => {
    await mutateAsync(formData, {
      onSuccess: async () => {
        toast(formatMessage(messages.saved));
        touch('cohorts');
        onSave?.();
        onClose?.();
      },
    });
  };

  if (cohortId && !data) {
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
                <Input placeholder="Cohort name" autoFocus={!cohortId} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
          <FormLabel className="text-sm font-semibold text-foreground">
            {formatMessage(labels.action)}
          </FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="parameters.action.type"
              rules={{ required: formatMessage(labels.required) }}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ActionSelect {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parameters.action.value"
              rules={{ required: formatMessage(labels.required) }}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <LookupField projectId={projectId} type={type} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <FormField
            control={form.control}
            name="parameters.dateRange"
            rules={{ required: formatMessage(labels.required) }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{formatMessage(labels.dateRange)}</FormLabel>
                <FormControl>
                  <DateFilter {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="parameters.filters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.filters)}</FormLabel>
              <FormControl>
                <FieldFilters
                  projectId={projectId}
                  value={field.value}
                  onChange={field.onChange}
                  exclude={['path', 'event']}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
