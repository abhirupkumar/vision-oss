'use client';
import { useMutation } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useApi } from '@/components/hooks';
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

type FormData = {
  name: string;
  description: string;
  goalEventName: string;
  variants: { name: string; weight: number }[];
};

export function ABTestCreateForm({
  projectId,
  onSave,
  onClose,
}: {
  projectId: string;
  onSave: () => void;
  onClose: () => void;
}) {
  const { post } = useApi();

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      goalEventName: '',
      variants: [
        { name: 'Control', weight: 50 },
        { name: 'Variant A', weight: 50 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => post(`/projects/${projectId}/ab-tests`, data),
    onSuccess: () => {
      toast.success('A/B test created');
      onSave();
    },
    onError: () => toast.error('Failed to create test'),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(data => mutate(data))} className="flex flex-col gap-5 py-2">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: 'Name is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Test Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Homepage CTA Button" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="goalEventName"
          rules={{ required: 'Goal event is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Event Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. signup, purchase, button_click" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <FormLabel className="text-sm font-medium">Variants</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() =>
                append({ name: `Variant ${String.fromCharCode(64 + fields.length)}`, weight: 50 })
              }
            >
              <Plus size={12} /> Add Variant
            </Button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <FormField
                control={form.control}
                name={`variants.${index}.name`}
                rules={{ required: 'Required' }}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Variant name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`variants.${index}.weight`}
                rules={{ required: 'Required', min: { value: 1, message: 'Min 1' } }}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Weight"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {fields.length > 2 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => remove(index)}
                  className="mt-0"
                >
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Weights are relative — e.g. 50/50 means equal split.
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner size={14} className="mr-2" />}
            Create Test
          </Button>
        </div>
      </form>
    </Form>
  );
}
