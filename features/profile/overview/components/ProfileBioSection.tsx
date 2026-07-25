'use client';

import { MapPin, Phone, Share2, Settings, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PendingPostsBanner from './PendingPostsBanner';
import { text } from '../../constants';

export interface ShopProfileData {
  name: string;
  avatar?: string | null;
  handleId: string;
  bio?: string | null;
  address?: string | null;
  showAddress?: boolean | null;
  phone?: string | null;
  isVerified?: boolean;
}

interface ShopStatsProps {
  publishedCount: number;
}

function ShopStats({ publishedCount }: ShopStatsProps) {
  return (
    <div className="flex-grow flex items-center justify-start pb-2 text-primary" dir="rtl">
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-sm text-primary">{publishedCount}</span>
        <span className="text-xs text-secondary">{text.overview.statPublished}</span>
      </div>
    </div>
  );
}

interface ProfileBioSectionProps {
  shopProfile: ShopProfileData;
  publishedCount: number;
  pendingCount?: number;
  rejectedCount?: number;
  onCall?: () => void;
  onShare?: () => void;
  onEditProfile?: () => void;
  onNavigatePending?: () => void;
}

export default function ProfileBioSection({
  shopProfile,
  publishedCount,
  pendingCount = 0,
  rejectedCount: _rejectedCount = 0,
  onCall,
  onShare,
  onEditProfile,
  onNavigatePending,
}: ProfileBioSectionProps) {
  if (!shopProfile) return null;

  const avatarSrc = shopProfile.avatar;
  const bioText = shopProfile.bio?.trim() || text.overview.bioEmpty;

  return (
    <div className="px-4 pt-5 flex flex-col pb-4">
      {/* Profile Photo and Stats Row */}
      <div className="flex items-end justify-between gap-3">
        {/* Profile Photo */}
        <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-l1 border border-primary/10 flex items-center justify-center text-secondary shrink-0 transform-gpu active:scale-95 transition-transform">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              className="w-full h-full object-cover"
              alt={shopProfile.name}
            />
          ) : (
            <Store className="w-8 h-8" aria-hidden="true" />
          )}
        </div>

        {/* Seller stats */}
        <ShopStats publishedCount={publishedCount} />
      </div>

      {/* Shop Title */}
      <div className="flex flex-col mt-3 text-right" dir="rtl">
        <div className="flex items-center gap-1.5">
          <h2 className="font-bold text-lg text-primary">{shopProfile.name}</h2>
        </div>
      </div>

      {/* Shop bio */}
      <div className="mt-3 text-right" dir="rtl">
        <p className="text-[13px] text-secondary leading-6 text-justify whitespace-pre-wrap">
          {bioText}
        </p>
      </div>

      {/* Shop location address */}
      {shopProfile.showAddress !== false && shopProfile.address ? (
        <div className="mt-2.5 flex items-center justify-start gap-1 text-secondary text-[11px] self-start" dir="rtl">
          <MapPin className="w-3.5 h-3.5 text-secondary/70 shrink-0" />
          <span className="truncate">{shopProfile.address}</span>
        </div>
      ) : null}

      {/* Pending posts banner */}
      {pendingCount > 0 && onNavigatePending ? (
        <PendingPostsBanner pendingCount={pendingCount} onNavigate={onNavigatePending} />
      ) : null}

      {/* Reusable Project Buttons: CALL, SHARE & EDIT PROFILE */}
      <div className="flex items-center gap-2 mt-4" dir="rtl">
        {/* CALL SHOP */}
        <Button
          id="profile-call-btn"
          variant="filled"
          onClick={onCall}
          className="flex-1 h-12 font-bold text-xs rounded-xl gap-1.5 shadow-sm active:scale-98"
        >
          <Phone className="w-4 h-4" />
          <span>{text.overview.callAction}</span>
        </Button>

        {/* EDIT PROFILE */}
        <Button
          id="profile-edit-btn"
          variant="secondary"
          onClick={onEditProfile}
          title={text.overview.editActionTitle}
          aria-label={text.overview.editActionTitle}
          className="px-3 h-12 font-bold text-xs rounded-xl gap-1.5 shrink-0 border border-zinc-200 active:scale-98"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">{text.overview.editAction}</span>
        </Button>

        {/* SHARE STORE */}
        <Button
          id="profile-share-btn"
          variant="secondary"
          onClick={onShare}
          title={text.overview.shareActionTitle}
          aria-label={text.overview.shareActionTitle}
          className="px-3 h-12 font-bold text-xs rounded-xl gap-1.5 shrink-0 border border-zinc-200 active:scale-98"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">{text.overview.shareAction}</span>
        </Button>
      </div>
    </div>
  );
}
