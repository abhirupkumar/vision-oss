'use client';
import { useForm } from 'react-hook-form';
import { useMessages } from '@/components/hooks';
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
import type { ApiError } from '@/lib/types';

export function TypeConfirmationForm({
  confirmationValue,
  buttonLabel,
  buttonVariant = 'default',
  isLoading,
  error,
  onConfirm,
  onClose,
}: {
  confirmationValue: string;
  buttonLabel?: string;
  buttonVariant?: any;
  isLoading?: boolean;
  error?: string | Error;
  onConfirm?: () => void;
  onClose?: () => void;
}) {
  const { formatMessage, labels, messages, getErrorMessage, FormattedMessage } = useMessages();
  const form = useForm({
    defaultValues: {
      confirm: '',
    },
  });

  if (!confirmationValue) {
    return null;
  }

  const handleSubmit = () => {
    onConfirm?.();
  };

  // Map umami variants to shadcn
  const variantMap: Record<string, any> = {
    danger: 'destructive',
    primary: 'default',
    outline: 'outline',
    quiet: 'ghost',
  };

  const variant = variantMap[buttonVariant] || buttonVariant;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {getErrorMessage(error as ApiError)}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            {...messages.actionConfirmation}
            values={{
              confirmation: (
                <span className="font-bold text-foreground underline decoration-destructive/30 decoration-2 underline-offset-2">
                  {confirmationValue}
                </span>
              ),
            }}
          />
        </p>
        <FormField
          control={form.control}
          name="confirm"
          rules={{ validate: value => value === confirmationValue }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formatMessage(labels.confirm)}</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            {formatMessage(labels.cancel)}
          </Button>
          <Button
            type="submit"
            variant={variant}
            disabled={isLoading || form.watch('confirm') !== confirmationValue}
          >
            {buttonLabel || formatMessage(labels.ok)}
          </Button>
        </div>
      </form>
    </Form>
  );
}
