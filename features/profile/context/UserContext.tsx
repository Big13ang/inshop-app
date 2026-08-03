'use client';

import { createContext, use, useEffect, ReactNode, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { profileService, UserMe, UserProfile } from '../services/profileService';
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

function handleUserRedirection(
  user: UserProfile | null,
  pathname: string | null,
  router: ReturnType<typeof useRouter>
) {
  if (!pathname) return;

  const isAppRoute = pathname.startsWith('/app');
  const isEditProfilePage = pathname === '/app/profile/edit';

  if (isAppRoute) {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (user.sellerProfile == null && !isEditProfilePage) {
      router.replace('/app/profile/edit');
    }
  }
}

function UserInitializer({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, error } = profileService.useSuspenseMe();

  const currentUser = user ?? null;
  const isLoggedIn = currentUser != null;

  useEffect(() => {
    handleUserRedirection(currentUser, pathname, router);
  }, [currentUser, pathname, router]);

  debugAuth('user-context', 'state', {
    pathname,
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
