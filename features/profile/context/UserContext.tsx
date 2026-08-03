'use client';

import { createContext, use, ReactNode, Suspense } from 'react';
import { profileService, UserMe } from '../services/profileService';
import { debugAuth } from '@/lib/utils/authDebug';

interface UserContextType {
  user: UserMe | null;
  isLoading: boolean;
  error: Error | null;
  isLoggedIn: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
  initialUser?: UserMe | null;
}

function UserInitializer({ children }: { children: ReactNode }) {
  const { data: user, error } = profileService.useSuspenseMe();

  const currentUser = user ?? null;
  const isLoggedIn = currentUser != null;

  debugAuth('user-context', 'state', {
    isLoggedIn,
    hasSellerProfile: currentUser?.sellerProfile != null,
  });

  const contextValue: UserContextType = {
    user: currentUser,
    isLoading: false,
    error: (error as Error) || null,
    isLoggedIn,
  };

  return (
    <UserContext value={contextValue}>
      {children}
    </UserContext>
  );
}

export function UserProvider({ children }: UserProviderProps) {
  return (
    <Suspense fallback={<div className="h-full w-full bg-background" />}>
      <UserInitializer>{children}</UserInitializer>
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
