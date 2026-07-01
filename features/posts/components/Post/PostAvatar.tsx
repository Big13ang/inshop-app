import { usePostContext } from './PostContext';
import { User } from 'lucide-react';

export function PostAvatar({ fallbackAlt = 'فروشنده' }: { fallbackAlt?: string }) {
  const { state } = usePostContext();
  const { sellerAvatar, sellerName } = state.post;

  if (!sellerAvatar) {
    return (
      <div
        className="w-10 h-10 rounded-full border border-primary/10 flex items-center justify-center bg-container-base text-secondary transition-transform active:scale-95"
        aria-label={sellerName || fallbackAlt}
        role="img"
      >
        <User className="w-5 h-5" />
      </div>
    );
  }

  return (
    <img
      src={sellerAvatar}
      className="w-10 h-10 rounded-full object-cover border border-primary/10 transition-transform active:scale-95"
      alt={sellerName || fallbackAlt}
    />
  );
}

