import { useContext } from 'react';
import { LinkContext } from '@/app/(main)/[organizationId]/links/LinkProvider';

export function useLink() {
  return useContext(LinkContext);
}
