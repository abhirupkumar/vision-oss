'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useChannelSSE } from '@/hooks/useChannelSSE';

const ChannelContext = createContext<ReturnType<typeof useChannelSSE> | null>(null);

export function ChannelProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const channel = useChannelSSE(projectId);
  return <ChannelContext.Provider value={channel}>{children}</ChannelContext.Provider>;
}

export function useChannel() {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error('useChannel must be used within a ChannelProvider');
  }
  return context;
}
