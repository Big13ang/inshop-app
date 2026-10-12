'use client';

import { Users } from 'lucide-react';
import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import type { profileSchemaType } from '../editProfileSchema';

export interface EditShopSocialInputsProps {
  followerCount?: string | number;
  setFollowerCount?: (value: string) => void;
  instagram?: string;
  setInstagram?: (value: string) => void;
  variant?: 'theme' | 'neutral'; // 'theme' for main app, 'neutral' for zinc theme
}

export function EditShopSocialInputs({
  followerCount: propFollowerCount,
  setFollowerCount: propSetFollowerCount,
  instagram: propInstagram,
  setInstagram: propSetInstagram,
  variant = 'theme',
}: EditShopSocialInputsProps = {}) {
  const formContext = useFormContext<profileSchemaType>();

  const followerCount =
    propFollowerCount !== undefined
      ? propFollowerCount
      : (formContext?.watch('followerCount') ?? '');

  const instagram =
    propInstagram !== undefined
      ? propInstagram
      : (formContext?.watch('instagram') ?? '');

  const handleFollowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (propSetFollowerCount) {
      propSetFollowerCount(value);
    } else if (formContext) {
      formContext.setValue('followerCount', value, { shouldDirty: true });
    }
  };

  const handleInstagramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/^@/, '');
    if (propSetInstagram) {
      propSetInstagram(cleaned);
    } else if (formContext) {
      formContext.setValue('instagram', cleaned, { shouldDirty: true });
    }
  };

  const isNeutral = variant === 'neutral';

  const labelClass = isNeutral
    ? 'text-xs font-bold text-zinc-800 block mb-1'
    : 'text-xs font-semibold text-secondary mb-1.5 block';

  const inputClass = isNeutral
    ? 'w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors'
    : 'w-full bg-surface-variant border border-primary/10 rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 focus:outline-none focus:border-accent';

  const iconColorClass = isNeutral ? 'text-zinc-400' : 'text-secondary/40';

  return (
    <div className="space-y-4">
      {/* 1. Number of Followers Input */}
      <div>
        <label htmlFor="edit-shop-follower-count" className={labelClass}>
          تعداد دنبال‌کننده
        </label>
        <div className="relative">
          <Input
            id="edit-shop-follower-count"
            type="text"
            value={followerCount}
            onChange={handleFollowerChange}
            placeholder="مثال: ۲۴.۵K یا ۱۲۰۰"
            className={inputClass}
          />
          <div className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${iconColorClass}`}>
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Instagram ID Input */}
      <div>
        <label htmlFor="edit-shop-instagram" className={labelClass}>
          آیدی اینستاگرام
        </label>
        <div className="relative">
          <Input
            id="edit-shop-instagram"
            type="text"
            value={instagram}
            onChange={handleInstagramChange}
            placeholder="shop_id"
            dir="ltr"
            className={inputClass}
          />
          <div className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${iconColorClass}`}>
            <InstagramIcon className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
