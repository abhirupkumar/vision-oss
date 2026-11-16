'use client';
import { useForm } from 'react-hook-form';
import { useInsightConfigQuery, useApi } from '@/components/hooks';
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function ProjectInsightsSettings({ projectId }: { projectId: string }) {
  const { data: config, isLoading, refetch } = useInsightConfigQuery(projectId);
  const { put } = useApi();

  const form = useForm({
    defaultValues: {
      enabled: true,
      frequency: 'daily',
      modelTier: 'balanced',
      maxSteps: 40,
      maxInsightsPerProject: 3,
      cooldownHours: 6,
      lookbackDays: 7,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        enabled: config.enabled ?? true,
        frequency: config.frequency ?? 'daily',
        modelTier: config.modelTier ?? 'balanced',
        maxSteps: config.maxSteps ?? 40,
        maxInsightsPerProject: config.maxInsightsPerProject ?? 3,
        cooldownHours: config.cooldownHours ?? 6,
        lookbackDays: config.lookbackDays ?? 7,
      });
    }
  }, [config, form]);

  const handleSubmit = async (data: any) => {
    try {
      await put('/insights/config', { ...data, projectId });
      toast.success('Insights settings saved');
      refetch();
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading insights configuration...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">AI Insights Generation</h3>
          <p className="text-sm text-muted-foreground">
            Configure how your automated Databuddy AI insights run in the background.
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Automatic Insights</FormLabel>
                <FormDescription>
                  Automatically generate AI insights for this project in the background.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Run Frequency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>How often the AI will analyze your data.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modelTier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model Tier</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model tier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fast">Fast (Lower Cost)</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="deep">Deep (Comprehensive)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Intelligence level of the AI agent.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lookbackDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lookback Period (Days)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormDescription>Timeframe of data analyzed per run.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxInsightsPerProject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Active Insights</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormDescription>Maximum unresolved insights shown at once.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cooldownHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cooldown Hours</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormDescription>Suppress duplicate insights for this duration.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxSteps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Tool Steps</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormDescription>Maximum allowed iterations per analysis run.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : 'Save AI Settings'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
