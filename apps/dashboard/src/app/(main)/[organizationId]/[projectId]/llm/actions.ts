'use server';

import { getLlmTrace, getLlmConversation } from '@vision/db';

export async function fetchTraceWaterfall(projectId: string, traceId: string) {
  try {
    return await getLlmTrace(projectId, traceId);
  } catch (err) {
    console.error('Failed to fetch trace waterfall', err);
    return [];
  }
}

export async function fetchConversation(projectId: string, id: string, bySession: boolean = true) {
  try {
    return await getLlmConversation(projectId, id, bySession);
  } catch (err) {
    console.error('Failed to fetch conversation', err);
    return [];
  }
}
