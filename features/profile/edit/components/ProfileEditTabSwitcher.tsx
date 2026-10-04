'use client';

import { Store, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProfileEditTab = 'shop' | 'account';

export interface ProfileEditTabSwitcherProps {
  activeTab: ProfileEditTab;
  onTabChange: (tab: ProfileEditTab) => void;
}

export function ProfileEditTabSwitcher({
  activeTab,
  onTabChange,
}: ProfileEditTabSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="بخش‌های ویرایش پروفایل"
      className="w-full bg-container-base rounded-2xl p-1 flex items-center justify-between border border-outline/30 mb-4"
      dir="rtl"
    >
      {/* Tab: User Account (Default) */}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'account'}
        id="profile-edit-tab-account"
        onClick={() => onTabChange('account')}
        className={cn(
          'flex-1 py-1.5 px-3 rounded-xl text-center text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
          activeTab === 'account'
            ? 'bg-surface-l3 text-foreground font-bold shadow-raised'
            : 'text-secondary hover:text-foreground'
        )}
      >
        <User className="size-3.5" />
        <span>حساب کاربری</span>
      </button>

      {/* Tab: Store Profile */}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'shop'}
        id="profile-edit-tab-shop"
        onClick={() => onTabChange('shop')}
        className={cn(
          'flex-1 py-1.5 px-3 rounded-xl text-center text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
          activeTab === 'shop'
            ? 'bg-surface-l3 text-foreground font-bold shadow-raised'
            : 'text-secondary hover:text-foreground'
        )}
      >
        <Store className="size-3.5" />
        <span>پروفایل فروشگاه</span>
      </button>
    </div>
  );
}
