import { Suspense } from 'react';
import { SSOPage } from './SSOPage';

export default function () {
  return (
    <Suspense>
      {/* @ts-expect-error Async Server Component */}
      <SSOPage />
    </Suspense>
  );
}
