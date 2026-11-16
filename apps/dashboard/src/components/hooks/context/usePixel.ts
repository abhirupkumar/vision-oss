import { useContext } from 'react';
import { PixelContext } from '@/app/(main)/[organizationId]/pixels/PixelProvider';

export function usePixel() {
  return useContext(PixelContext);
}
