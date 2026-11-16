'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { useApi, useNavigation } from '@/components/hooks';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';

type FormData = {
  name: string;
  config: { trigger: 'any_event' | 'event_received' | 'anomaly_detected'; eventName?: string };
  sendToApp: boolean;
  sendToEmail: boolean;
  integrationIds: string[];
};

export function NotificationRuleCreateForm({
  projectId,
  onSave,
  onClose,
}: {
  projectId: string;
  onSave: () => void;
  onClose: () => void;
}) {
  const { post, get } = useApi();
  const { organizationId } = useNavigation();

  const { data: integrations } = useQuery({
    queryKey: ['integrations', organizationId],
    queryFn: () => get(`/organizations/${organizationId}/integrations`),
    enabled: !!organizationId,
  });

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      config: { trigger: 'any_event' },
      sendToApp: true,
      sendToEmail: false,
      integrationIds: [],
    },
  });

  const trigger = useWatch({ control: form.control, name: 'config.trigger' });
  const selectedIds: string[] = useWatch({ control: form.control, name: 'integrationIds' }) ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => post(`/projects/${projectId}/notification-rules`, data),
    onSuccess: () => {
      toast.success('Notification rule created');
      onSave();
    },
    onError: () => toast.error('Failed to create rule'),
  });

  const toggleIntegration = (id: string) => {
    const current = form.getValues('integrationIds') ?? [];
    form.setValue(
      'integrationIds',
      current.includes(id) ? current.filter((i: string) => i !== id) : [...current, id],
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(data => {
          if (!data.integrationIds?.length) {
            toast.error(
              'Please select at least one integration (Slack or Discord) to enable notifications for this project.',
            );
            return;
          }
          mutate(data);
        })}
        className="flex flex-col gap-5 py-2"
      >
        <FormField
          control={form.control}
          name="name"
          rules={{ required: 'Name is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rule Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Alert on purchases" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config.trigger"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trigger</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="any_event">Every tracked event</SelectItem>
                  <SelectItem value="event_received">Specific event name</SelectItem>
                  <SelectItem value="anomaly_detected">Statistical Anomaly Detected</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {trigger === 'event_received' && (
          <FormField
            control={form.control}
            name="config.eventName"
            rules={{ required: 'Event name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. purchase, signup" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex flex-col gap-2">
          <FormLabel>Notify via Integrations</FormLabel>
          {!integrations?.length ? (
            <p className="text-sm text-muted-foreground">
              No integrations connected. Connect Slack or Discord in{' '}
              <a href={`/${organizationId}/integrations`} className="underline text-primary">
                Integrations
              </a>
              .
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {integrations.map((integration: any) => (
                <label
                  key={integration.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(integration.id)}
                    onChange={() => toggleIntegration(integration.id)}
                    className="h-4 w-4"
                  />
                  <div>
                    <div className="text-sm font-medium">{integration.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {integration.config?.type}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="sendToApp"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
              <div>
                <FormLabel>In-app notification</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Record a notification in the dashboard
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sendToEmail"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
              <div>
                <FormLabel>Email notification (Mailgun)</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Send email alert to project owner
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner size={14} className="mr-2" />}
            Create Rule
          </Button>
        </div>
      </form>
    </Form>
  );
}
