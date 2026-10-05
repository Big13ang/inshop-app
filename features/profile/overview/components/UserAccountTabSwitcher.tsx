'use client';

import { Store, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type ProfileOverviewTab = 'account' | 'seller';

export interface UserAccountTabSwitcherProps {
  activeTab: ProfileOverviewTab;
  onTabChange: (tab: ProfileOverviewTab) => void;
}

export function UserAccountTabSwitcher({
  activeTab,
  onTabChange,
}: UserAccountTabSwitcherProps) {
  const handleSelectAccount = () => {
    onTabChange('account');
  };

  const handleSelectSeller = () => {
    onTabChange('seller');
  };

  return (
    <div
      role="tablist"
      aria-label="بخش‌های پروفایل"
      className="w-full bg-container-base rounded-2xl p-1 flex items-center justify-between border border-outline/30 mb-4"
      dir="rtl"
    >
      <Button
        type="button"
        role="tab"
        aria-selected={activeTab === 'account'}
        id="profile-overview-tab-account"
        variant="ghost"
        onClick={handleSelectAccount}
        className={cn(
          'flex-1 h-auto py-1.5 px-3 rounded-xl text-center text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
          activeTab === 'account'
            ? 'bg-surface-l3 text-foreground font-bold shadow-raised hover:bg-surface-l3'
            : 'text-secondary hover:text-foreground hover:bg-transparent'
        )}
      >
        <User className="size-3.5" />
        <span>حساب کاربری</span>
      </Button>

      <Button
        type="button"
        role="tab"
        aria-selected={activeTab === 'seller'}
        id="profile-overview-tab-seller"
        variant="ghost"
        onClick={handleSelectSeller}
        className={cn(
          'flex-1 h-auto py-1.5 px-3 rounded-xl text-center text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
          activeTab === 'seller'
            ? 'bg-surface-l3 text-foreground font-bold shadow-raised hover:bg-surface-l3'
            : 'text-secondary hover:text-foreground hover:bg-transparent'
        )}
      >
        <Store className="size-3.5" />
        <span>پروفایل فروشگاه</span>
      </Button>
    </div>
  );
}
