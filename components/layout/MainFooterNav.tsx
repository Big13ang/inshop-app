'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, LogOut, PlusSquare } from 'lucide-react';
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

    function navigate(href: string) {
        if (pathname === href) return;
        startTransition(() => {
            router.push(href);
        });
    }

    const tabs: FooterTabConfig[] = [
        {
            id: ROUTES.pendingPosts,
            icon: Clock,
            label: 'صف انتظار',
            onPress: () => navigate(ROUTES.pendingPosts),
        },
        {
            id: ROUTES.newPost,
            icon: PlusSquare,
            label: 'پست جدید',
            onPress: () => navigate(ROUTES.newPost),
        },
        {
            id: 'logout',
            icon: LogOut,
            label: 'خروج',
            isActionButton: true,
            onPress: () => navigate(ROUTES.login),
        },
    ];

    return <Footer.Nav activeTab={pathname} onTabChange={navigate} tabs={tabs} />;
}
