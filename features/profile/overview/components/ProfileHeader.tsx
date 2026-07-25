'use client';

import { LogOut } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';

interface ProfileHeaderProps {
  handleId: string;
  hasClickedPost: boolean;
  onBack: () => void;
  onLogout?: () => void;
  isVerified?: boolean;
}

export default function ProfileHeader({
  handleId,
  hasClickedPost,
  onBack,
  onLogout,
}: ProfileHeaderProps) {
  const isValidHandle = handleId && handleId.length > 0;

  const handleBackClick = () => {
    if (!isValidHandle) return;
    onBack();
  };

  const canShowLogout = !!onLogout && !hasClickedPost;

  return (
    <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 w-full h-16 border-b border-primary/5 shrink-0 relative" dir="rtl">
      <BackButton
        onClick={handleBackClick}
        id="profile-back-btn"
      />

      <div className="flex-shrink-0 flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
        <h1 id="profile-handle-title" dir="ltr" className="font-rounded font-bold text-lg text-primary tracking-tight">
          @{handleId}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          {canShowLogout ? (
            <button
              type="button"
              onClick={onLogout}
              title="خروج از حساب کاربری"
              id="profile-logout-header-btn"
              className="w-10 h-10 flex items-center justify-center text-primary/80 hover:text-zinc-950 hover:bg-zinc-100 transition-colors rounded-xl cursor-pointer"
            >
              <LogOut className="w-[18px] h-[18px] rotate-180" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>
    </header>
  );
}
