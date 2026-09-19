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
  MoreVertical,
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
      icon: <Info className="size-5" aria-hidden="true" />,
      title: text.menu.items.about.title,
      description: text.menu.items.about.description,
      href: text.menu.items.about.href,
    },
    {
      id: 'contact',
      icon: <Phone className="size-5" aria-hidden="true" />,
      title: text.menu.items.contact.title,
      description: text.menu.items.contact.description,
      href: text.menu.items.contact.href,
    },
    {
      id: 'privacy',
      icon: <ShieldCheck className="size-5" aria-hidden="true" />,
      title: text.menu.items.privacy.title,
      description: text.menu.items.privacy.description,
      href: text.menu.items.privacy.href,
    },
    {
      id: 'terms',
      icon: <ScrollText className="size-5" aria-hidden="true" />,
      title: text.menu.items.terms.title,
      description: text.menu.items.terms.description,
      href: text.menu.items.terms.href,
    },
    {
      id: 'logout',
      icon: <LogOut className="size-5" aria-hidden="true" />,
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
        <MoreVertical className="size-5" aria-hidden="true" />
      </AnimatedIconButton>

      <Dialog.Root isOpen={isOpen} onClose={handleCloseMenu}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Content variant="drawer" className="pb-8 pt-2 px-4 font-sans select-none">
            {/* Top drag bar */}
            <div className="mx-auto w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mb-3" />

            {/* Header with circular Close X button and centered title */}
            <div className="relative mb-5 flex items-center justify-center" dir="rtl">
              <button
                type="button"
                onClick={handleCloseMenu}
                aria-label={text.menu.closeAction}
                className="absolute left-0 size-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-foreground transition-colors cursor-pointer active:scale-95"
              >
                <X className="size-4" />
              </button>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                {text.menu.title}
              </h2>
            </div>

            {/* Looped Card Items */}
            <div className="flex flex-col space-y-2.5">
              {menuItems.map((item) => {
                const cardInner = (
                  <>
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {item.icon}
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-sm font-bold text-foreground leading-snug">
                          {item.title}
                        </span>
                        <span className="text-xs text-secondary/80 font-normal mt-0.5">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <ChevronLeft className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
                  </>
                );

                const cardClassName =
                  'tap-card flex w-full items-center justify-between rounded-2xl border border-zinc-200/90 bg-surface p-3.5 transition-all hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:hover:bg-zinc-800/50 cursor-pointer';

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
