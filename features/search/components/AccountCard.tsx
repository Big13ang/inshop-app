import { useState } from 'react';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchProfileDto } from '../types';
import { formatBioWithEllipsis } from '../utils/searchBio';

interface AccountCardProps {
  profile: SearchProfileDto;
}

export function AccountCard({ profile }: AccountCardProps) {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  const handleImageLoad = () => {
    setImageStatus('loaded');
  };

  const handleImageError = () => {
    setImageStatus('error');
  };

  const isLoaded = imageStatus === 'loaded';
  const hasError = imageStatus === 'error';
  const showFallback = hasError || !profile.profilePhotoUrl;
  const truncatedBio = formatBioWithEllipsis(profile.bio || undefined, 60);

  const profileHref = profile.username ? `/@${profile.username}` : '#';
  const displayName = profile.shopName || profile.username;

  return (
    <Link
      href={profileHref}
      className="w-full flex items-center gap-3 py-2 px-1 cursor-pointer select-none text-right group active:opacity-60 transition-opacity"
      id={`inshop-account-item-${profile.id || profile.username}`}
    >
      {/* Profile Image / Avatar with Internal Shimmer Loading */}
      <div className="w-11 h-11 rounded-full relative shrink-0 overflow-hidden bg-zinc-100 flex items-center justify-center">
        {/* Shimmer Placeholder while image is downloading */}
        {!isLoaded && !showFallback && (
          <div
            className="absolute inset-0 bg-zinc-200 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%] animate-shimmer"
            aria-hidden="true"
          />
        )}

        {/* Fallback Icon if avatar fails to load or is empty */}
        {showFallback ? (
          <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
            <Store className="w-5 h-5" />
          </div>
        ) : (
          /* biome-ignore lint/performance/noImgElement: dynamic user avatar */
          <img
            src={profile.profilePhotoUrl || ''}
            alt={displayName}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </div>

      {/* Account Name & Bio */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className="font-medium text-sm text-zinc-900 truncate leading-snug">
          {displayName}
        </span>
        {truncatedBio ? (
          <p className="text-[11.5px] text-zinc-500 font-normal leading-normal mt-0.5 text-right overflow-hidden text-ellipsis line-clamp-1">
            {truncatedBio}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
