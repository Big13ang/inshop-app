'use client';

import { useTransition, useState } from 'react';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, PlusSquare, Loader2 } from 'lucide-react';
import { profileService } from '@/features/profile/services/profileService';
import { getMediaUrl } from '@/features/posts/utils/media';
import { cn } from '@/lib/utils';
import Footer, { type FooterTabConfig } from './Footer';

const ROUTES = {
    profile: '/app/profile',
    newPost: '/app/posts/new',
    login: '/auth/login',
} as const;

export default function MainFooterNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [, startTransition] = useTransition();
    const { signOut } = useAuthFlow();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { data: meData } = profileService.useMe();

    const rawPhoto = meData?.sellerProfile?.profilePhotoUrl || meData?.profilePhotoUrl || meData?.avatarUrl;
    const profilePhotoUrl = rawPhoto ? getMediaUrl({ url: rawPhoto }) : '';

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
    };

    const tabs: FooterTabConfig[] = [
        {
            id: ROUTES.profile,
            label: 'پروفایل',
            onPress: navigate,
            disabled: isLoggingOut,
            customRender: (isActive: boolean) => {
                if (profilePhotoUrl) {
                    return (
                        <span className="flex flex-col items-center">
                            <span
                                className={cn(
                                    'size-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border-2',
                                    isActive ? 'border-[2.5px] border-primary' : 'border-secondary'
                                )}
                            >
                                <img
                                    src={profilePhotoUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </span>
                        </span>
                    );
                }
                return (
                    <span className="flex flex-col items-center">
                        <User
                            data-testid="tab-icon"
                            className={cn(
                                'size-8',
                                isActive ? 'text-primary' : 'text-secondary',
                            )}
                            strokeWidth={isActive ? 2.5 : 2}
                            fill={isActive ? 'currentColor' : 'none'}
                            aria-hidden="true"
                        />
                    </span>
                );
            },
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
                <Loader2 data-testid="logout-spinner" className="size-8 animate-spin text-secondary" />
            ) : undefined,
        },
    ];

    return <Footer.Nav activeTab={pathname} tabs={tabs} />;
}
