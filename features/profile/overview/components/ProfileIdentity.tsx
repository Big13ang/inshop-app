import { Store } from 'lucide-react';

interface ProfileAvatarProps {
  src: string | null;
  alt: string;
}

function ProfileAvatar({ src, alt }: ProfileAvatarProps) {
  return (
    <div className="size-20 shrink-0 overflow-hidden rounded-pill border border-primary/10 bg-surface-l1">
      {src ? (
        // Remote seller avatars come straight from the CDN with no known dimensions.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className="flex size-full items-center justify-center text-secondary">
          <Store className="size-7" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

interface ProfileNameProps {
  shopName: string;
  isVerified: boolean;
}

function ProfileName({ shopName }: ProfileNameProps) {
  return (
    <div className="mt-3 flex items-center gap-1.5 text-right" dir="rtl">
      <h2 className="text-lg font-bold text-primary">{shopName}</h2>
    </div>
  );
}

export const ProfileIdentity = {
  Avatar: ProfileAvatar,
  Name: ProfileName,
};

export default ProfileIdentity;
