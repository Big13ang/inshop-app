import { Users, MapPin } from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import type { PublicSellerProfile, SellerProfile } from '../../services/profileService';
import { formatFollowerCount } from '../formatFollowerCount';

const EMPTY_VALUE = '-';

interface ShopProfileSocialInfoProps {
  profile: PublicSellerProfile | SellerProfile;
}

export function ShopProfileSocialInfo({ profile }: ShopProfileSocialInfoProps) {
  // Only the owner's full profile (from /me) has Instagram data and addressShow;
  // the public profile already omits hidden addresses.
  const sellerProfile = 'userId' in profile ? profile : null;

  const followers = formatFollowerCount(sellerProfile?.instagramFollowersCount) || EMPTY_VALUE;
  const username = sellerProfile?.instagramUsername || EMPTY_VALUE;
  const address = sellerProfile?.addressShow === false ? null : profile.address;

  return (
    <div className="space-y-2.5 text-secondary">
      <div className="flex items-center gap-2">
        <InstagramIcon className="w-4 h-4 shrink-0" />
        <span className="text-xs font-medium" dir="ltr">{username}</span>
      </div>

      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 shrink-0" />
        <span className="text-xs font-medium">تعداد دنبال‌کننده: {followers}</span>
      </div>

      {address && (
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="text-xs leading-relaxed">{address}</span>
        </div>
      )}
    </div>
  );
}
