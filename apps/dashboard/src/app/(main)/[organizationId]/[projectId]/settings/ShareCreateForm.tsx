'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '@/components/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ShareCreateForm({
  projectId,
  onSave,
  onCancel,
}: {
  projectId: string;
  onSave?: () => void;
  onCancel?: () => void;
}) {
  const { post } = useApi();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      await post(`/projects/${projectId}/shares`, { name });
      toast('Share created successfully');
      onSave?.();
    } catch (err) {
      setError('Failed to create share');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Share Name</Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter share name"
          maxLength={200}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">Create Share</Button>
      </div>
    </form>
  );
}
