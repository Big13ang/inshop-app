'use client';

import { createContext, use, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { queryKeys } from '@/lib/query-keys';
import { debugAuth } from '@/lib/utils/authDebug';
import { http } from '@/lib/utils';
import { UserProfile } from '../services/profileService';

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  isLoggedIn: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
  initialUser?: UserProfile | null;
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth') ?? false;

  debugAuth('user-context', 'render', {
    pathname,
    isAuthPage,
    hasInitialUser: !!initialUser,
  });

  const { data: user, isLoading, error } = useQuery<UserProfile>({
    queryKey: queryKeys.profile.me,
    queryFn: async () => {
      debugAuth('user-context', 'queryMe:start', { pathname });
      const user = await http.get<UserProfile>('/me');
      debugAuth('user-context', 'queryMe:success', { hasUser: !!user });
      return user;
    },
    initialData: initialUser ?? undefined,
    staleTime: Infinity,
    retry: false,
    enabled: !isAuthPage,
  });

  const contextValue: UserContextType = {
    user: user ?? null,
    isLoading: isLoading && !user,
    error: error as Error | null,
    isLoggedIn: !!user,
  };

  debugAuth('user-context', 'state', {
    pathname,
    isLoading: contextValue.isLoading,
    hasError: !!contextValue.error,
    isLoggedIn: contextValue.isLoggedIn,
  });

  return (
    <UserContext value={contextValue}>
      {children}
    </UserContext>
  );
}

export function useUser() {
  const context = use(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
