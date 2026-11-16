import { ClerkLoaded, ClerkLoading, SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { AuthSkeleton } from '@/components/auth/AuthSkeleton';

export default function SignUpPage() {
  return (
    <>
      <ClerkLoading>
        <AuthSkeleton />
      </ClerkLoading>
      <ClerkLoaded>
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          <div className="flex flex-col gap-1.5 text-center sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create an account
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Join Vision and start analyzing your data today
            </p>
          </div>

          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full',
                cardBox: 'w-full shadow-none',
                card: 'shadow-none border-0 p-0 bg-transparent w-full',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                header: 'hidden',
                formButtonPrimary:
                  'bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-2.5 transition-colors shadow-sm dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 dark:font-semibold rounded-lg',
                socialButtonsBlockButton:
                  'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 dark:text-zinc-200 transition-colors rounded-lg py-2',
                socialButtonsBlockButtonText: 'font-medium text-slate-700 dark:text-zinc-200 text-sm',
                dividerLine: 'bg-slate-200 dark:bg-zinc-800',
                dividerText:
                  'text-slate-400 dark:text-zinc-500 text-xs uppercase tracking-wider font-medium',
                formFieldLabel: 'text-slate-700 dark:text-zinc-300 font-medium text-xs mb-1.5',
                formFieldInput:
                  'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20 rounded-lg text-sm py-2 px-3',
                identityPreviewText: 'text-slate-800 dark:text-zinc-200 font-medium text-sm',
                identityPreviewEditButton:
                  'text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 text-xs',
                formFieldAction:
                  'text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 text-xs font-medium',
                footerAction: 'hidden',
                formFieldErrorText: 'text-rose-500 text-xs mt-1 font-medium',
                formButtonReset:
                  'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs',
              },
            }}
          />

          <div className="text-center text-xs text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
            Already have an account?{' '}
            <Link
              href="/sign-in"
              className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </ClerkLoaded>
    </>
  );
}
