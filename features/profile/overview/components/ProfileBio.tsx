import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { text } from '../../constants';

interface ProfileBioProps {
  bio: string;
}

export function ProfileBio({ bio }: ProfileBioProps) {
  const hasBio = bio.trim().length > 0;

  return (
    <div className="mt-3 text-right" dir="rtl">
      <p
        className={cn(
          'text-[13px] leading-6 whitespace-pre-wrap',
          hasBio ? 'text-secondary' : 'text-secondary/60',
        )}
      >
        {hasBio ? bio : text.overview.bioEmpty}
      </p>
    </div>
  );
}

interface ProfileAddressProps {
  address: string;
}

export function ProfileAddress({ address }: ProfileAddressProps) {
  return (
    <div
      className="mt-2.5 flex items-center gap-1 self-start text-[11px] text-secondary"
      dir="rtl"
    >
      <MapPin className="size-3.5 shrink-0 text-secondary/70" aria-hidden="true" />
      <span className="truncate">{address}</span>
    </div>
  );
}
