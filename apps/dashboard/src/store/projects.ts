import { produce } from 'immer';
import { create } from 'zustand';
import type { DateRange } from '@/lib/types';

const store = create(() => ({}));

export function setProjectDateRange(projectId: string, dateRange: DateRange) {
  store.setState(
    produce(state => {
      if (!state[projectId]) {
        state[projectId] = {};
      }

      state[projectId].dateRange = { ...dateRange, modified: Date.now() };

      return state;
    }),
  );
}

export function setProjectDateCompare(projectId: string, dateCompare: string) {
  store.setState(
    produce(state => {
      if (!state[projectId]) {
        state[projectId] = {};
      }

      state[projectId].dateCompare = dateCompare;

      return state;
    }),
  );
}

export const useProjects = store;
