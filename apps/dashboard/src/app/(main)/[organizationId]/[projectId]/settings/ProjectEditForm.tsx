'use client';
import { useForm } from 'react-hook-form';
import { useMessages, useProject, useUpdateQuery } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DOMAIN_REGEX } from '@/lib/constants';

export function ProjectEditForm({ projectId, onSave }: { projectId: string; onSave?: () => void }) {
  const project = useProject();
  const { formatMessage, labels, messages, getErrorMessage } = useMessages();
  const { mutateAsync, error, touch, toast } = useUpdateQuery(`/projects/${projectId}`);

  const form = useForm({
    defaultValues: {
      id: project?.id || '',
      name: project?.name || '',
      domain: project?.domain || '',
    },
  });

  const handleSubmit = async (data: any) => {
    await mutateAsync(data, {
      onSuccess: async () => {
        toast(formatMessage(messages.saved));
        touch('projects');
        touch(`project:${project.id}`);
        onSave?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {getErrorMessage(error)}
          </div>
        )}

        <FormItem>
          <FormLabel>{formatMessage(labels.projectId)}</FormLabel>
          <div className="flex gap-2">
            <Input value={project?.id} readOnly className="bg-muted" />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(project?.id);
                toast('Copied!');
              }}
            >
              {formatMessage(labels.copy)}
            </Button>
          </div>
        </FormItem>

        <FormField
          control={form.control}
          name="name"
          rules={{ required: formatMessage(labels.required) }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.name)}</FormLabel>
              <FormControl>
                <Input {...field} />
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
            pattern: {
              value: DOMAIN_REGEX,
              message: formatMessage(messages.invalidDomain),
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.domain)}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {formatMessage(labels.save)}
          </Button>
        </div>
      </form>
    </Form>
  );
}
