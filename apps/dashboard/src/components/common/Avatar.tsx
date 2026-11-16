import { lorelei } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { useMemo } from 'react';
import { getColor, getPastel } from '@/lib/colors';

const lib = lorelei;

export function Avatar({
  seed,
  size = 128,
  className,
  ...props
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const backgroundColor = getPastel(getColor(seed), 4);

  const avatar = useMemo(() => {
    return createAvatar(lib, {
      ...props,
      seed: seed || '',
      size,
      backgroundColor: [backgroundColor],
    }).toDataUri();
  }, []);

  return (
    <img
      src={avatar}
      alt="Avatar"
      className={className}
      style={{ borderRadius: '100%', width: size }}
    />
  );
}
