import { useState } from 'react';
import { usePostContext } from './PostContext';
import { Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/utils';

export function PostAvatar({ fallbackAlt = 'فروشنده' }: { fallbackAlt?: string }) {
  const { state } = usePostContext();
  const [hasError, setHasError] = useState(false);
  const { sellerAvatar, sellerName } = state.post;
  const avatarUrl = getMediaUrl(sellerAvatar);

  const handleImageError = () => {
    setHasError(true);
  };

  if (!avatarUrl || hasError) {
    return (
      <div
        className="w-10 h-10 rounded-full border border-primary/10 flex items-center justify-center bg-container-base text-secondary transition-transform active:scale-95"
        aria-label={sellerName || fallbackAlt}
        role="img"
      >
        <Store className="w-5 h-5" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      className="w-10 h-10 rounded-full object-cover border border-primary/10 transition-transform active:scale-95"
      alt={sellerName || fallbackAlt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={handleImageError}
    />
  );
}

