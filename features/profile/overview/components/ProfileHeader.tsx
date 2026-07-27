'use client';

import { useRouter } from 'next/navigation';
import BackButton from '@/components/ui/BackButton';

interface ProfileHeaderProps {
  username?: string;
  onBack?: () => void;
}

export default function ProfileHeader({ username, onBack }: ProfileHeaderProps) {
  const router = useRouter();
  const displayUsername = username?.trim() || `@inShop`;

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 w-full h-16 border-b border-primary/5 shrink-0 relative" dir="rtl">
      <BackButton
        onClick={handleBackClick}
        id="profile-back-btn"
      />

      <div className="flex-shrink-0 flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
        <h1 id="profile-handle-title" dir="ltr" className="font-rounded font-bold text-lg text-primary tracking-tight">
          @{displayUsername}
        </h1>
      </div>
    </header>
  );
}
