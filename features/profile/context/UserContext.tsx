'use client';

import { createContext, use, ReactNode, Suspense } from 'react';
import { profileService, UserMe } from '../services/profileService';
import { debugAuth } from '@/lib/utils/authDebug';

interface UserContextType {
  user: UserMe | null;
  error: Error | null;
  isLoggedIn: boolean;
  isVerifying: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
  initialUser?: UserMe | null;
}

function UserInitializer({ children, initialUser }: UserProviderProps) {
  const { data: user, error, isFetching } = profileService.useSuspenseMe(
    initialUser !== undefined ? { initialData: initialUser } : undefined
  );

  const currentUser = user ?? null;
  const isLoggedIn = currentUser != null;
  // With initialData seeded from SSR, this first render's isLoggedIn reflects
  // the server's cookie check, not the browser's. staleTime: 0 always kicks
  // off a client-side refetch of /me on mount, so isFetching here means that
  // verification is still in flight — callers must not redirect on
  // isLoggedIn=false until isVerifying goes false.
  const isVerifying = isFetching;

  debugAuth('user-context', 'state', {
    isLoggedIn,
    isVerifying,
    hasSellerProfile: currentUser?.sellerProfile != null,
  });

  const contextValue: UserContextType = {
    user: currentUser,
    error: (error as Error) || null,
    isLoggedIn,
    isVerifying,
  };

  return (
    <UserContext value={contextValue}>
      {children}
    </UserContext>
  );
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  return (
    <Suspense fallback={<div className="h-full w-full bg-background" />}>
      <UserInitializer initialUser={initialUser}>{children}</UserInitializer>
    </Suspense>
  );
}

export function useUser() {
  const context = use(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
