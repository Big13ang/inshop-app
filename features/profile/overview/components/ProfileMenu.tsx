'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Info,
  Phone,
  ShieldCheck,
  ScrollText,
  LogOut,
  ChevronLeft,
  X,
  Menu as HamburgerMenu,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import AnimatedIconButton from '@/components/ui/AnimatedIconButton';
import LogoutConfirmationBottomSheet from '@/components/auth/LogoutConfirmationBottomSheet';
import { text } from '../../constants';

interface ProfileMenuProps {
  username?: string;
  isOwner?: boolean;
}

interface MenuItemData {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  action?: () => void;
}

export function ProfileMenu({ username: _username, isOwner: _isOwner = false }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleOpenMenu = () => setIsOpen(true);
  const handleCloseMenu = () => setIsOpen(false);

  const handleCloseLogoutConfirm = () => setIsLogoutConfirmOpen(false);

  const handleOpenLogout = () => {
    handleCloseMenu();
    setIsLogoutConfirmOpen(true);
  };

  const menuItems: MenuItemData[] = [
    {
      id: 'about',
      icon: <Info className="size-5" strokeWidth={1.75} aria-hidden="true" />,
      title: text.menu.items.about.title,
      description: text.menu.items.about.description,
      href: text.menu.items.about.href,
    },
    {
      id: 'contact',
      icon: <Phone className="size-5" strokeWidth={1.75} aria-hidden="true" />,
      title: text.menu.items.contact.title,
      description: text.menu.items.contact.description,
      href: text.menu.items.contact.href,
    },
    {
      id: 'privacy',
      icon: <ShieldCheck className="size-5" strokeWidth={1.75} aria-hidden="true" />,
      title: text.menu.items.privacy.title,
      description: text.menu.items.privacy.description,
      href: text.menu.items.privacy.href,
    },
    {
      id: 'terms',
      icon: <ScrollText className="size-5" strokeWidth={1.75} aria-hidden="true" />,
      title: text.menu.items.terms.title,
      description: text.menu.items.terms.description,
      href: text.menu.items.terms.href,
    },
    {
      id: 'logout',
      icon: <LogOut className="size-5" strokeWidth={1.75} aria-hidden="true" />,
      title: text.menu.items.logout.title,
      description: text.menu.items.logout.description,
      action: handleOpenLogout,
    },
  ];

  return (
    <>
      <AnimatedIconButton
        id="profile-menu-trigger-btn"
        onClick={handleOpenMenu}
        aria-label={text.menu.title}
        title={text.menu.title}
        className="size-10 flex items-center justify-center text-primary active:scale-95"
      >
        <HamburgerMenu className="size-5" aria-hidden="true" />
      </AnimatedIconButton>

      <Dialog.Root isOpen={isOpen} onClose={handleCloseMenu}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Content variant="drawer" className="pb-8 pt-1 px-4 font-sans select-none">
            {/* Header with circular Close X button, centered title, and subtle bottom divider */}
            <div className="relative mb-3.5 flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800 pb-3 px-1" dir="rtl">
              <button
                type="button"
                onClick={handleCloseMenu}
                aria-label={text.menu.closeAction}
                className="absolute left-1 size-8 rounded-full bg-[#f4f4f5] hover:bg-[#e4e4e7] dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-foreground transition-colors cursor-pointer active:scale-95"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                {text.menu.title}
              </h2>
            </div>

            {/* Looped Card Items matching media_1789814415062.png */}
            <div className="flex flex-col space-y-2.5">
              {menuItems.map((item) => {
                const cardInner = (
                  <>
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#f4f4f5] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 group-hover:bg-[#ececee] dark:group-hover:bg-zinc-700/80 transition-colors">
                        {item.icon}
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-400 font-normal mt-0.5">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <ChevronLeft className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500 stroke-[1.75] group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" aria-hidden="true" />
                  </>
                );

                const cardClassName =
                  'group flex w-full items-center justify-between rounded-[20px] border border-[#e4e4e7] bg-white px-4 py-3.5 transition-all duration-150 hover:bg-[#fafafa] hover:border-zinc-300 active:scale-[0.985] active:bg-[#f4f4f5] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/60 dark:hover:border-zinc-700 cursor-pointer select-none';

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={handleCloseMenu}
                      className={cardClassName}
                      dir="rtl"
                    >
                      {cardInner}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className={cardClassName}
                    dir="rtl"
                  >
                    {cardInner}
                  </button>
                );
              })}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <LogoutConfirmationBottomSheet
        isOpen={isLogoutConfirmOpen}
        onClose={handleCloseLogoutConfirm}
        onConfirm={handleCloseLogoutConfirm}
      />
    </>
  );
}
