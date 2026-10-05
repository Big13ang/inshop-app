/* eslint-disable @next/next/no-img-element */
import { User, CreditCard, Calendar, Phone, Accessibility, Eye, VolumeX } from 'lucide-react';
import type { UserMe } from '@/features/profile/services/profileService';
import { formatPersianDisplayDate, toPersianDigits } from '@/components/ui/PersianDatePicker/persianDateUtils';

export interface UserBioInfoProps {
  user: UserMe;
}

function extractNameAndFamily(user: UserMe): { firstName: string; lastName: string } {
  const directFirst = (user.firstName || user.profile?.name || '').trim();
  const directLast = (user.lastName || user.profile?.lastName || '').trim();

  if (directFirst || directLast) {
    return {
      firstName: directFirst,
      lastName: directLast,
    };
  }

  const rawName = (user.name || '').trim();
  if (!rawName) {
    return { firstName: '', lastName: '' };
  }

  const parts = rawName.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function UserBioInfo({ user }: UserBioInfoProps) {
  const { firstName, lastName } = extractNameAndFamily(user);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const displayName = fullName || user.name || 'کاربر این‌شاپ';
  const phoneNumber = user.profile?.phoneNumber;
  const nationalId = user.nationalId || user.profile?.nationalIdNumber;
  const birthDate = user.birthDatePersian;
  const hasAnyAccessibility = Boolean(
    user.usesWheelchair || user.isBlindOrLowVision || user.isDeafOrHardOfHearing
  );

  return (
    <div className="flex flex-col text-right w-full" dir="rtl">
      {/* 1. Header Identity: Avatar & User Title */}
      <div className="flex items-center gap-3.5 mb-3.5">
        <div className="size-14 rounded-full overflow-hidden bg-surface-l2 border border-outline/30 flex items-center justify-center text-secondary shrink-0 shadow-xs">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={displayName}
              className="size-full object-cover"
            />
          ) : (
            <User className="size-7 text-secondary/70" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-base font-bold text-foreground truncate">
            {displayName}
          </h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-l1 border border-outline/25 text-[10px] font-semibold text-secondary w-fit">
            حساب کاربری شخصی
          </span>
        </div>
      </div>

      {/* 2. Structured Information Card */}
      <div className="rounded-2xl border border-outline/30 bg-surface-l3 p-3.5 shadow-raised space-y-3">
        {/* Separated Name and Family */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-surface-l1/70 border border-outline/20">
            <span className="text-[11px] font-medium text-secondary flex items-center gap-1">
              <User className="size-3 text-secondary/70" aria-hidden="true" />
              <span>نام</span>
            </span>
            <span className="text-xs font-bold text-foreground truncate">
              {firstName || <span className="text-secondary/50 font-normal">ثبت‌نشده</span>}
            </span>
          </div>

          <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-surface-l1/70 border border-outline/20">
            <span className="text-[11px] font-medium text-secondary flex items-center gap-1">
              <User className="size-3 text-secondary/70" aria-hidden="true" />
              <span>نام خانوادگی</span>
            </span>
            <span className="text-xs font-bold text-foreground truncate">
              {lastName || <span className="text-secondary/50 font-normal">ثبت‌نشده</span>}
            </span>
          </div>
        </div>

        {/* Contact and Identification Details */}
        <div className="space-y-2 pt-1">
          {phoneNumber && (
            <div className="flex items-center justify-between text-xs py-1.5 border-t border-outline/15">
              <div className="flex items-center gap-2 text-secondary">
                <Phone className="size-3.5 text-secondary/70 shrink-0" aria-hidden="true" />
                <span className="font-medium text-[11px]">شماره تماس</span>
              </div>
              <span className="font-sans font-bold text-foreground text-xs" dir="ltr">
                {toPersianDigits(phoneNumber)}
              </span>
            </div>
          )}

          {nationalId && (
            <div className="flex items-center justify-between text-xs py-1.5 border-t border-outline/15">
              <div className="flex items-center gap-2 text-secondary">
                <CreditCard className="size-3.5 text-secondary/70 shrink-0" aria-hidden="true" />
                <span className="font-medium text-[11px]">کد ملی</span>
              </div>
              <span className="font-sans font-bold text-foreground text-xs" dir="ltr">
                {toPersianDigits(nationalId)}
              </span>
            </div>
          )}

          {birthDate && (
            <div className="flex items-center justify-between text-xs py-1.5 border-t border-outline/15">
              <div className="flex items-center gap-2 text-secondary">
                <Calendar className="size-3.5 text-secondary/70 shrink-0" aria-hidden="true" />
                <span className="font-medium text-[11px]">تاریخ تولد</span>
              </div>
              <span className="font-sans font-bold text-foreground text-xs">
                {formatPersianDisplayDate(birthDate)}
              </span>
            </div>
          )}
        </div>

        {/* Accessibility Badges */}
        {hasAnyAccessibility && (
          <div className="pt-2 border-t border-outline/15 flex flex-col gap-2">
            <span className="text-[11px] font-medium text-secondary">دسترسی‌پذیری</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {user.usesWheelchair && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-l1 border border-outline/25 rounded-full text-[11px] font-medium text-foreground shadow-2xs">
                  <Accessibility className="size-3.5 text-foreground" aria-hidden="true" />
                  <span>ویلچر</span>
                </span>
              )}
              {user.isBlindOrLowVision && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-l1 border border-outline/25 rounded-full text-[11px] font-medium text-foreground shadow-2xs">
                  <Eye className="size-3.5 text-foreground" aria-hidden="true" />
                  <span>کم‌بینا</span>
                </span>
              )}
              {user.isDeafOrHardOfHearing && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-l1 border border-outline/25 rounded-full text-[11px] font-medium text-foreground shadow-2xs">
                  <VolumeX className="size-3.5 text-foreground" aria-hidden="true" />
                  <span>کم‌شنوا</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
