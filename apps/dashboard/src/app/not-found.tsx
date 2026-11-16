'use client';
import { useMessages } from '@/components/hooks';

export default function () {
  const { formatMessage, labels } = useMessages();

  return (
    <div className="flex min-h-[600px] flex-grow items-center justify-center">
      <h1 className="text-2xl font-bold text-foreground">{formatMessage(labels.pageNotFound)}</h1>
    </div>
  );
}
