'use client';
import { LoginForm } from './LoginForm';

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-def-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <LoginForm />
      </div>
    </div>
  );
}
