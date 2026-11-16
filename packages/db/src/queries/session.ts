import type { QueryFilters } from '@vision/shared-types';

export interface CreateReplayChunkArgs {
  projectId: string;
  visitorId: string;
  sessionId: string;
  chunkIndex: number;
  events: Uint8Array;
  eventCount: number;
  startedAt: Date;
  endedAt: Date;
}

export async function getRawReplayChunks(projectId: string, sessionId: string) {
  return [];
}

export async function createReplayChunk(args: CreateReplayChunkArgs) {
  return null;
}

export async function deleteReplaysByProject(projectId: string) {
  return null;
}

export async function getReplaySaved(projectId: string, sessionId: string): Promise<boolean> {
  return false;
}

export async function getReplaySavedById(id: string) {
  return null;
}

export async function createReplaySaved(projectId: string, sessionId: string, name: string) {
  return null;
}

export async function updateReplaySaved(projectId: string, sessionId: string, name: string) {
  return null;
}

export async function deleteReplaySaved(projectId: string, sessionId: string) {
  return null;
}

export async function getSavedReplays(projectId: string, filters: QueryFilters) {
  const { page = 1, pageSize = 10 } = filters;
  const limit = Number(pageSize);

  return {
    data: [],
    count: 0,
    page: Number(page),
    pageSize: limit,
  };
}
