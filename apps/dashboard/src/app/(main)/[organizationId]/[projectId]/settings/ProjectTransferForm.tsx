'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useApi, useModified, useNavigation } from '@/components/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProjectTransferForm({
  projectId,
  projectName,
  onSave,
  onClose,
}: {
  projectId: string;
  projectName: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { post } = useApi();
  const { touch } = useModified();
  const { organizationId, router } = useNavigation();

  const [step, setStep] = useState<1 | 2>(1);
  const [typedName, setTypedName] = useState('');
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNameMatched = typedName.trim() === projectName.trim();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameMatched) return;
    setError(null);
    setStep(2);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter an email address.');
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      await post(`/projects/${projectId}/transfer`, { email: cleanEmail });
      touch('projects');
      touch(`projects:${projectId}`);
      toast.success('Project ownership transferred successfully.');
      onSave?.();
      onClose?.();

      if (organizationId) {
        router.push(`/${organizationId}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err?.message || 'User not found');
    } finally {
      setIsPending(false);
    }
  };

  if (step === 1) {
    return (
      <form onSubmit={handleNext} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Transferring project ownership is permanent. To begin, please type the project name{' '}
          <strong className="text-foreground underline decoration-destructive/30 decoration-2 underline-offset-2">
            {projectName}
          </strong>{' '}
          below to confirm.
        </p>

        <div className="space-y-2">
          <Label>Project Name</Label>
          <Input
            value={typedName}
            onChange={(e) => {
              setTypedName(e.target.value);
              setError(null);
            }}
            placeholder={projectName}
            autoComplete="off"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {onClose && (
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={!isNameMatched}>
            Continue <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleTransfer} className="flex flex-col gap-4">
      <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Note:</span> The recipient must already have an account on this platform. If this email is not found, the transfer will not be performed.
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label>New Owner Email Address</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder="colleague@example.com"
          autoComplete="off"
          autoFocus
        />
      </div>

      <div className="flex justify-between items-center pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setStep(1);
            setError(null);
          }}
          disabled={isPending}
        >
          <ArrowLeft size={14} className="mr-1" /> Back
        </Button>
        <div className="flex gap-2">
          {onClose && (
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="destructive"
            disabled={isPending || !email.trim()}
          >
            {isPending ? 'Transferring...' : 'Transfer Ownership'}
          </Button>
        </div>
      </div>
    </form>
  );
}
