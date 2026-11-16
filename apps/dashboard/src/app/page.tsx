'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLoginQuery } from '@/components/hooks/queries/useLoginQuery';
import { useAuth, useClerk } from '@clerk/nextjs';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading, error } = useLoginQuery();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

  useEffect(() => {
    if (!isLoading && !error) {
      if (!user) {
        router.push('/sign-in');
      } else if (user.organizations?.length > 0) {
        // Find the most recently updated organization, or just use the first one
        const org = user.organizations[0];
        router.push(`/${org.id}`);
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, isLoading, error, router]);

  if (error) {
    console.log("Error fetching user data:", error);
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-center p-4">
        <h1 className="text-2xl font-bold mb-2">Service Unavailable</h1>
        <p className="text-zinc-500 mb-4 max-w-md">
          We couldn't reach the server or verify your account. Please try again later.
        </p>
        <button
          onClick={() => signOut()}
          className="bg-zinc-950 text-white px-4 py-2 rounded hover:bg-zinc-800"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
