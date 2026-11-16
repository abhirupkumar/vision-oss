'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useApi } from '@/components/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  name: z.string().min(1).max(200),
});

export function ReplaySaveForm({
  projectId,
  visitorId,
  sessionId,
  onSave,
  onCancel,
}: {
  projectId: string;
  visitorId: string;
  sessionId: string;
  onSave?: () => void;
  onCancel?: () => void;
}) {
  const { post } = useApi();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = schema.safeParse({ name });

    if (!result.success) {
      setError('Name is required');
      return;
    }

    try {
      await post(`/projects/${projectId}/replays/saved`, {
        visitorId,
        sessionId,
        name,
      });
      onSave?.();
    } catch (err) {
      setError('Failed to save replay');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Replay Name</Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter replay name"
          maxLength={200}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
