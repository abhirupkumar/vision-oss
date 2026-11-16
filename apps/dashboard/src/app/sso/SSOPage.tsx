'use client';
import { redirect } from 'next/navigation';

// SSO via custom JWT tokens is no longer supported — auth is fully handled by Clerk.
// Redirect to the Clerk sign-in page.
export function SSOPage() {
  redirect('/sign-in');
}
