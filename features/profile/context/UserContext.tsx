'use client';

import { createContext, use, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { queryKeys } from '@/lib/query-keys';
import { debugAuth } from '@/lib/utils/authDebug';
import { http, type ApiResponse } from '@/lib/utils';
import { UserMe } from '../services/profileService';

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

export function UserProvider({ children, initialUser }: UserProviderProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth') ?? false;

  debugAuth('user-context', 'render', {
    pathname,
    isAuthPage,
    hasInitialUser: !!initialUser,
  });

  const { data: user, isLoading, error } = useQuery<UserMe>({
    queryKey: queryKeys.profile.me,
    queryFn: async () => {
      debugAuth('user-context', 'queryMe:start', { pathname });
      const res = await http.get<ApiResponse<UserMe>>('/me');
      debugAuth('user-context', 'queryMe:success', { hasUser: !!res?.data });
      return res.data;
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
