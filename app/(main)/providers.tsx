'use client';

import '@/sentry.client.config';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useServiceWorkerUpdateReload } from '@/lib/hooks/useServiceWorkerUpdateReload';
import { UserProvider } from '@/features/profile/context/UserContext';
import { UserProfile } from '@/features/profile/services/profileService';
import { SerwistProvider } from '@serwist/next/react';
import { env } from '@/env';

export default function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: UserProfile | null;
}) {
  const client = getQueryClient();
  const isPwaDisabled = env.NODE_ENV === 'development';
  useServiceWorkerUpdateReload(!isPwaDisabled);

  return (
    <SerwistProvider
      swUrl="/sw.js"
      disable={isPwaDisabled}
      register={true}
      cacheOnNavigation={false}
      reloadOnOnline={true}
    >
      <QueryClientProvider client={client}>
        <UserProvider initialUser={initialUser}>
          {children}
        </UserProvider>
      </QueryClientProvider>
    </SerwistProvider>
  );
}
