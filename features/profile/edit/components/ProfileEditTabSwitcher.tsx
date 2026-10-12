'use client';

import { Store, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProfileEditTab = 'shopProfile' | 'userProfile';

export interface ProfileEditTabSwitcherProps {
  activeTab: ProfileEditTab;
  onTabChange: (tab: ProfileEditTab) => void;
}

export function ProfileEditTabSwitcher({
  activeTab,
  onTabChange,
}: ProfileEditTabSwitcherProps) {
  const handleAccountClick = () => {
    onTabChange('userProfile');
  };

  const handleShopClick = () => {
    onTabChange('shopProfile');
  };

  return (
    <div
      role="tablist"
      aria-label="بخش‌های ویرایش پروفایل"
      className="w-full bg-container-base rounded-2xl p-1 flex items-center justify-between border border-outline/30 mb-4"
      dir="rtl"
    >
      {/* Tab: User Account */}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'userProfile'}
        id="profile-edit-tab-account"
        onClick={handleAccountClick}
        className={cn(
          'flex-1 py-1.5 px-3 rounded-xl text-center text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
          activeTab === 'userProfile'
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
        aria-selected={activeTab === 'shopProfile'}
        id="profile-edit-tab-shop"
        onClick={handleShopClick}
        className={cn(
          'flex-1 py-1.5 px-3 rounded-xl text-center text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
          activeTab === 'shopProfile'
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
