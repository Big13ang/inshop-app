/* eslint-disable @next/next/no-img-element */
'use client';

import { useRouter } from 'next/navigation';
import { MapPin, Phone, Share2, Settings, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PROFILE_ROUTES, text } from '../../constants';
import PendingPostsBanner from './PendingPostsBanner';
import type { UserProfile } from '../../services/profileService';
import { ShopStats } from './ProfileShopStats';
import { copyToClipboard } from '@/lib/utils/copyToClipboard';

interface ProfileBioSectionProps {
  sellerProfile?: UserProfile;
  publishedCount: number;
  pendingCount?: number;
}


export default function ProfileBioSection({
  sellerProfile,
  publishedCount,
  pendingCount = 0,
}: ProfileBioSectionProps) {
  const router = useRouter();

  const handleCall = () => {
    const phoneText = sellerProfile?.phones?.[0]?.phoneNumber || '';

    if (phoneText) {
      window.location.href = `tel:${phoneText}`;
    } else {
      toast.error(text.overview.callUnavailable);
    }
  };

  const handleShare = async () => {
    const storeUrl = `${window.location.origin}/${sellerProfile?.username || ''}`;

    await copyToClipboard(storeUrl, {
      onSuccess: () => toast.success(text.overview.shareCopied),
      onError: () => toast.error(text.overview.shareFailed),
    })
  };

  const handleEditProfile = () => {
    router.push(PROFILE_ROUTES.edit);
  };

  return (
    <div className="px-4 pt-5 flex flex-col pb-4">
      {/* Profile Photo and Stats Row */}
      <div className="flex items-end justify-between gap-3">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-l1 border border-primary/10 flex items-center justify-center text-secondary shrink-0 transform-gpu active:scale-95 transition-transform">
          {sellerProfile?.profilePhotoUrl ? (
            <img src={sellerProfile?.profilePhotoUrl} className="w-full h-full object-cover" alt={sellerProfile?.shopName} />
          ) : (
            <Store className="w-8 h-8" aria-hidden="true" />
          )}
        </div>

        <ShopStats publishedCount={publishedCount} />
      </div>

      {/* Shop Title */}
      <div className="flex flex-col mt-3 text-right" dir="rtl">
        <div className="flex items-center gap-1.5">
          <h2 className="font-bold text-lg text-primary">{sellerProfile?.shopName}</h2>
        </div>
      </div>

      {/* Shop Bio */}
      <div className="mt-3 text-right" dir="rtl">
        <p className="text-[13px] text-secondary leading-6 text-justify whitespace-pre-wrap">
          {sellerProfile?.bio}
        </p>
      </div>

      {/* Location Address */}
      {sellerProfile?.addressShow && sellerProfile?.address ? (
        <div className="mt-2.5 flex items-center justify-start gap-1 text-secondary text-[11px] self-start" dir="rtl">
          <MapPin className="w-3.5 h-3.5 text-secondary/70 shrink-0" />
          <span className="truncate">{sellerProfile?.address}</span>
        </div>
      ) : null}

      {/* Pending Banner */}
      {pendingCount > 0 ? (
        <PendingPostsBanner pendingCount={pendingCount} />
      ) : null}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4" dir="rtl">
        <Button
          id="profile-call-btn"
          variant="filled"
          onClick={handleCall}
          className="flex-1 h-12 font-bold text-xs rounded-xl gap-1.5 shadow-sm active:scale-98"
        >
          <Phone className="w-4 h-4" />
          <span>{text.overview.callAction}</span>
        </Button>

        <Button
          id="profile-edit-btn"
          variant="secondary"
          onClick={handleEditProfile}
          title={text.overview.editActionTitle}
          aria-label={text.overview.editActionTitle}
          className="px-3 h-12 font-bold text-xs rounded-xl gap-1.5 shrink-0 border border-zinc-200 active:scale-98"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">{text.overview.editAction}</span>
        </Button>

        <Button
          id="profile-share-btn"
          variant="secondary"
          onClick={handleShare}
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
