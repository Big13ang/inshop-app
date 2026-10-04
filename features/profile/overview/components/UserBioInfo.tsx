import { CreditCard, Calendar, Phone, Accessibility, Eye, VolumeX } from 'lucide-react';
import type { UserMe } from '@/features/profile/services/profileService';
import { formatPersianDisplayDate, toPersianDigits } from '@/components/ui/PersianDatePicker/persianDateUtils';

export interface UserBioInfoProps {
  user: UserMe;
}

export function UserBioInfo({ user }: UserBioInfoProps) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const displayName = fullName || user.name || 'کاربر این‌شاپ';
  const phoneNumber = user.profile?.phoneNumber;
  const hasAnyAccessibility = user.usesWheelchair || user.isBlindOrLowVision || user.isDeafOrHardOfHearing;

  return (
    <div className="flex flex-col text-right" dir="rtl">
      {/* User Name Headline */}
      <div className="flex items-center gap-1.5 mt-3">
        <h2 className="font-bold text-lg text-primary">{displayName}</h2>
      </div>

      {/* User Bio Details: کد ملی، تاریخ تولد، شماره تماس، دسترسی‌پذیری */}
      <div className="mt-3.5 space-y-3">
        {user.nationalId && (
          <div className="flex items-center gap-2.5 text-sm text-secondary">
            <CreditCard className="size-4 text-secondary/70 shrink-0" aria-hidden="true" />
            <span className="text-secondary">کد ملی:</span>
            <span className="font-sans font-bold text-foreground" dir="ltr">
              {toPersianDigits(user.nationalId)}
            </span>
          </div>
        )}

        {user.birthDatePersian && (
          <div className="flex items-center gap-2.5 text-sm text-secondary">
            <Calendar className="size-4 text-secondary/70 shrink-0" aria-hidden="true" />
            <span className="text-secondary">تاریخ تولد:</span>
            <span className="font-sans font-bold text-foreground">
              {formatPersianDisplayDate(user.birthDatePersian)}
            </span>
          </div>
        )}

        {phoneNumber && (
          <div className="flex items-center gap-2.5 text-sm text-secondary">
            <Phone className="size-4 text-secondary/70 shrink-0" aria-hidden="true" />
            <span className="text-secondary">شماره تماس:</span>
            <span className="font-sans font-bold text-foreground" dir="ltr">
              {toPersianDigits(phoneNumber)}
            </span>
          </div>
        )}

        {/* نشان‌های ویژه دسترسی‌پذیری */}
        {hasAnyAccessibility && (
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-secondary ml-1">دسترسی‌پذیری:</span>
            {user.usesWheelchair && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-l1 border border-outline/30 rounded-full text-xs font-medium text-foreground shadow-xs">
                <Accessibility className="size-4 text-foreground" aria-hidden="true" />
                <span>ویلچر</span>
              </span>
            )}
            {user.isBlindOrLowVision && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-l1 border border-outline/30 rounded-full text-xs font-medium text-foreground shadow-xs">
                <Eye className="size-4 text-foreground" aria-hidden="true" />
                <span>کم‌بینا</span>
              </span>
            )}
            {user.isDeafOrHardOfHearing && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-l1 border border-outline/30 rounded-full text-xs font-medium text-foreground shadow-xs">
                <VolumeX className="size-4 text-foreground" aria-hidden="true" />
                <span>کم‌شنوا</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
