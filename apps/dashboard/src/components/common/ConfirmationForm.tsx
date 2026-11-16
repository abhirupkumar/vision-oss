'use client';
import type { ReactNode } from 'react';
import { useMessages } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import type { ApiError } from '@/lib/types';

export interface ConfirmationFormProps {
  message: ReactNode;
  buttonLabel?: ReactNode;
  buttonVariant?: string;
  isLoading?: boolean;
  error?: string | Error;
  onConfirm?: () => void;
  onClose?: () => void;
}

export function ConfirmationForm({
  message,
  buttonLabel,
  buttonVariant = 'default',
  isLoading,
  error,
  onConfirm,
  onClose,
}: ConfirmationFormProps) {
  const { formatMessage, labels, getErrorMessage } = useMessages();

  // Map legacy variants
  const variantMap: Record<string, any> = {
    danger: 'destructive',
    primary: 'default',
    quiet: 'ghost',
  };

  const variant = variantMap[buttonVariant] || buttonVariant;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {getErrorMessage(error as ApiError)}
        </div>
      )}
      <div className="text-sm text-muted-foreground leading-relaxed">{message}</div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
          {formatMessage(labels.cancel)}
        </Button>
        <Button type="submit" variant={variant} disabled={isLoading} data-test="button-confirm">
          {buttonLabel || formatMessage(labels.ok)}
        </Button>
      </div>
    </form>
  );
}
