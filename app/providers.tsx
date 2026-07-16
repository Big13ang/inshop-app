'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { UserProvider } from '@/features/profile/context/UserContext';
import { UserProfile } from '@/features/profile/services/profileService';

export default function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: UserProfile | null;
}) {
  const client = getQueryClient();
  return (
    <QueryClientProvider client={client}>
      <UserProvider initialUser={initialUser}>
        {children}
      </UserProvider>
    </QueryClientProvider>
  );
}
