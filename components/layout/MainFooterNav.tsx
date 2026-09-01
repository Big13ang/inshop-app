/* eslint-disable @next/next/no-img-element */
'use client';

import { useTransition, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/features/profile/context/UserContext';
import { cn, getMediaUrl } from '@/lib/utils';
import { HomeIcon } from '@/components/icons/HomeIcon';
import { AddIcon } from '@/components/icons/AddIcon';
import { ChatIcon } from '@/components/icons/ChatIcon';
import Footer, { type FooterTabConfig } from './Footer';
import LogoutConfirmationBottomSheet from '../auth/LogoutConfirmationBottomSheet';

const ROUTES = {
    home: '/',
    profile: '/app/profile',
    newPost: '/app/posts/new',
    login: '/auth/login',
} as const;

export default function MainFooterNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [, startTransition] = useTransition();
    const { user: meData } = useUser();
    const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);

    const rawPhoto = meData?.sellerProfile?.profilePhotoUrl;
    const profilePhotoUrl = rawPhoto ? getMediaUrl({ url: rawPhoto }) : '';

    function navigate(href: string) {
        if (pathname === href) return;
        startTransition(() => {
            router.push(href);
        });
    }

    const handleCloseConfirmLogoutModal = () => setIsConfirmLogoutOpen(false);

    function handleMessageClick() {
        toast.info('چت درون برنامه به‌زودی اضافه خواهد شد');
    }

    const tabs: FooterTabConfig[] = [
        {
            id: ROUTES.profile,
            label: 'پروفایل',
            onPress: navigate,
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
            id: 'messages',
            label: 'چت درون برنامه - بزودی',
            isActionButton: true,
            onPress: handleMessageClick,
            customRender: (isActive: boolean) => (
                <span className={cn(
                    "relative inline-flex items-center justify-center size-8 !overflow-visible",
                    "after:content-['بزودی'] after:absolute after:-top-2 after:-left-3",
                    "after:rounded-full after:bg-primary after:px-1.5 after:py-0.5",
                    "after:text-[9px] after:font-bold after:text-on-primary",
                    "after:leading-none after:whitespace-nowrap after:pointer-events-none after:z-50"
                )}>
                    <ChatIcon
                        data-testid="tab-icon"
                        width={32}
                        height={32}
                        className={cn(
                            'size-8',
                            isActive ? 'text-primary' : 'text-secondary',
                        )}
                        filled={isActive}
                        aria-hidden="true"
                    />
                </span>
            ),
        },
        {
            id: ROUTES.newPost,
            label: 'پست جدید',
            onPress: navigate,
            customRender: (isActive: boolean) => (
                <span className="flex flex-col items-center">
                    <AddIcon
                        data-testid="tab-icon"
                        width={32}
                        height={32}
                        className={cn(
                            'size-8',
                            isActive ? 'text-primary' : 'text-secondary',
                        )}
                        aria-hidden="true"
                    />
                </span>
            ),
        },
        {
            id: ROUTES.home,
            label: 'خانه',
            onPress: navigate,
            customRender: (isActive: boolean) => (
                <span className="flex flex-col items-center">
                    <HomeIcon
                        data-testid="tab-icon"
                        width={32}
                        height={32}
                        className={cn(
                            'size-8',
                            isActive ? 'text-primary' : 'text-secondary',
                        )}
                        filled={isActive}
                        aria-hidden="true"
                    />
                </span>
            ),
        },
    ];

    return <>
        <Footer.Nav activeTab={pathname} tabs={tabs} />
        <LogoutConfirmationBottomSheet
            isOpen={isConfirmLogoutOpen}
            onClose={handleCloseConfirmLogoutModal}
            onConfirm={handleCloseConfirmLogoutModal}
        />
    </>;
}
