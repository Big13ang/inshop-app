'use client';

import { createContext, use, ReactNode, Suspense } from 'react';
import { isUnauthorizedError, profileService, UserMe } from '../services/profileService';
import { debugAuth } from '@/lib/utils/authDebug';

export interface UserContextType {
  user: UserMe | null;
  error: Error | null;
  isLoggedIn: boolean;
  isVerifying: boolean;
  isRetryableError: boolean;
  refetch: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
  initialUser?: UserMe | null;
}

function UserInitializer({ children, initialUser }: UserProviderProps) {
  const {
    data: user,
    error,
    dataUpdatedAt,
    refetch,
  } = profileService.useMe(
    initialUser !== undefined
      ? { initialData: initialUser, initialDataUpdatedAt: 0 }
      : undefined
  );

  const currentUser = user ?? (error ? (initialUser ?? null) : null);
  const isLoggedIn = currentUser != null;
  const isRetryableError = Boolean(error && !isUnauthorizedError(error));
  const isVerifying = !error && dataUpdatedAt === 0;

  debugAuth('user-context', 'state', {
    isLoggedIn,
    isVerifying,
    isRetryableError,
    hasSellerProfile: currentUser?.sellerProfile != null,
  });

  if (isRetryableError) {
    console.warn('[UserContext] Active retryable error on /me. Preserving session state or awaiting retry.', {
      currentUser: currentUser?.id,
      error: error instanceof Error ? error.message : error,
    });
  }

  const handleRefetch = () => {
    refetch();
  };

  const contextValue: UserContextType = {
    user: currentUser,
    error: (error as Error) || null,
    isLoggedIn,
    isVerifying,
    isRetryableError,
    refetch: handleRefetch,
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
