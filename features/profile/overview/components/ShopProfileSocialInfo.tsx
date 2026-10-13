import { Users, MapPin } from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { formatFollowerCount } from '../formatFollowerCount';

export interface ShopSocialProfile {
  followerCount?: number | string;
  instagram?: string;
  handleId?: string;
  address?: string;
  showAddress?: boolean;
}

export interface ShopProfileSocialInfoProps {
  shopProfile: ShopSocialProfile;
  /**
   * Tailwind class for text & icon color.
   * Matches address styling (e.g. 'text-secondary' or 'text-zinc-500').
   */
  textColorClass?: string;
}

export function ShopProfileSocialInfo({
  shopProfile,
  textColorClass = 'text-secondary',
}: ShopProfileSocialInfoProps) {
  const hasFollowerCount =
    shopProfile.followerCount !== undefined && shopProfile.followerCount !== '';
  const hasInstagram = Boolean(shopProfile.instagram || shopProfile.handleId);
  const hasAddress =
    shopProfile.showAddress !== false && Boolean(shopProfile.address);

  if (!hasFollowerCount && !hasInstagram && !hasAddress) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      {/* 1. Number of Followers (Text above address, matching address color) */}
      {hasFollowerCount && (
        <div className={`flex items-center gap-2 ${textColorClass}`}>
          <Users className={`w-4 h-4 shrink-0 ${textColorClass}`} />
          <span className={`text-xs ${textColorClass} font-medium`}>
            تعداد دنبال‌کننده:{' '}
            {formatFollowerCount(shopProfile.followerCount ?? '')}
          </span>
        </div>
      )}

      {/* 2. Instagram ID (Text above address, matching address color - plain text, NOT a link) */}
      {hasInstagram && (
        <div className={`flex items-center gap-2 ${textColorClass}`}>
          <InstagramIcon className={`w-4 h-4 shrink-0 ${textColorClass}`} />
          <span className={`text-xs ${textColorClass} font-medium`} dir="ltr">
            @{String(shopProfile.instagram || shopProfile.handleId).replace(/^@/, '')}
          </span>
        </div>
      )}

      {/* 3. Address (for reference & comparison) */}
      {hasAddress && (
        <div className={`flex items-start gap-2 ${textColorClass}`}>
          <MapPin className={`w-4 h-4 shrink-0 ${textColorClass} mt-0.5`} />
          <span className={`text-xs ${textColorClass} leading-relaxed`}>
            {shopProfile.address}
          </span>
        </div>
      )}
    </div>
  );
}
