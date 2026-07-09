'use client';

import { useTransition, useState } from 'react';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';
import { usePathname, useRouter } from 'next/navigation';
import { Hourglass, LogOut, PlusSquare, Loader2 } from 'lucide-react';
import Footer, { type FooterTabConfig } from './Footer';

const ROUTES = {
    pendingPosts: '/app/posts/pending',
    newPost: '/app/posts/new',
    login: '/auth/login',
} as const;

export default function MainFooterNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [, startTransition] = useTransition();
    const { signOut } = useAuthFlow();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    function navigate(href: string) {
        if (pathname === href) return;
        startTransition(() => {
            router.push(href);
        });
    }

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        const success = await signOut();
        setIsLoggingOut(false);
        if (success) {
            navigate(ROUTES.login);
        }
    }

    const tabs: FooterTabConfig[] = [
        {
            id: ROUTES.pendingPosts,
            icon: Hourglass,
            label: 'صف انتظار',
            onPress: navigate,
            disabled: isLoggingOut,
        },
        {
            id: ROUTES.newPost,
            icon: PlusSquare,
            label: 'پست جدید',
            onPress: navigate,
            disabled: isLoggingOut,
        },
        {
            id: 'logout',
            icon: LogOut,
            label: 'خروج',
            isActionButton: true,
            onPress: handleLogout,
            disabled: isLoggingOut,
            customRender: isLoggingOut ? () => (
                <Loader2 data-testid="logout-spinner" className="size-7 animate-spin text-secondary" />
            ) : undefined,
        },
    ];

    return <Footer.Nav activeTab={pathname} tabs={tabs} />;
}

