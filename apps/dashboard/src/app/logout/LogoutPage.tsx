'use client';
import { useClerk } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setUser } from '@/store/app';

export function LogoutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    setUser(null);
    signOut({ redirectUrl: `${process.env.basePath || ''}/sign-in` });
  }, [signOut]);

  return null;
}
