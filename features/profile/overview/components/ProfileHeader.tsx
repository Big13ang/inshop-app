'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import AnimatedIconButton from '@/components/ui/AnimatedIconButton';
import { ProfileMenu } from './ProfileMenu';
import { PROFILE_ROUTES, text } from '../../constants';

interface ProfileHeaderProps {
  username?: string;
  isOwner?: boolean;
  onBack?: () => void;
}

export function ProfileHeader({ username, isOwner = false, onBack }: ProfileHeaderProps) {
  const displayUsername = username?.trim().replace(/^@/, '') || 'inShop';

  return (
    <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 w-full h-16 border-b border-primary/5 shrink-0 relative" dir="rtl">
      {/* Right side (start of RTL): Profile Menu for owner, BackButton for visitor */}
      <div className="flex items-center justify-start min-w-10">
        {isOwner ? (
          <ProfileMenu username={displayUsername} isOwner={isOwner} />
        ) : (
          <BackButton
            onClick={onBack}
            id="profile-back-btn"
          />
        )}
      </div>

      {/* Center: Store Handle */}
      <div className="flex-shrink-0 flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2 pointer-events-none">
        <h1 id="profile-handle-title" dir="ltr" className="font-rounded font-bold text-lg text-primary tracking-tight">
          @{displayUsername}
        </h1>
      </div>

      {/* Left side (end of RTL): Add Post (+) button for owner, empty spacer for visitor */}
      <div className="flex items-center justify-end min-w-10">
        {isOwner ? (
          <Link
            href={PROFILE_ROUTES.newPost}
            aria-label={text.overview.newPostAction}
            title={text.overview.newPostAction}
            className="inline-flex"
          >
            <AnimatedIconButton
              id="profile-add-post-btn"
              aria-label={text.overview.newPostAction}
              title={text.overview.newPostAction}
              className="size-10 flex items-center justify-center text-primary active:scale-95"
            >
              <Plus className="size-7 text-primary" strokeWidth={2.75} aria-hidden="true" />
            </AnimatedIconButton>
          </Link>
        ) : (
          <div className="size-10" />
        )}
      </div>
    </header>
  );
}
