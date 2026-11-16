import React from 'react';

export function AuthSkeleton() {
  return (
    <div className="w-full flex flex-col gap-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-900 rounded-md" />
      </div>

      {/* Social Buttons Skeleton */}
      <div className="space-y-3">
        <div className="h-10 w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg" />
        <div className="h-10 w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg" />
      </div>

      {/* Divider Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-8 bg-zinc-100 dark:bg-zinc-900 rounded" />
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Form Fields Skeleton */}
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-10 w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-10 w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg" />
        </div>
      </div>

      {/* Button Skeleton */}
      <div className="h-10 w-full bg-zinc-950 dark:bg-white/10 rounded-lg mt-2" />

      {/* Footer Link Skeleton */}
      <div className="flex justify-center">
        <div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-900 rounded" />
      </div>
    </div>
  );
}
