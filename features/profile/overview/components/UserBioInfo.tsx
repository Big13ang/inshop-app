/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/navigation';
import {
  User,
  CreditCard,
  Calendar,
  Phone,
  Accessibility,
  Eye,
  VolumeX,
  ShieldCheck,
  MapPin,
  Copy,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/utils/copyToClipboard';
import type { UserMe } from '@/features/profile/services/profileService';
import { formatPersianDisplayDate, toPersianDigits } from '@/components/ui/PersianDatePicker/persianDateUtils';
import { PROFILE_ROUTES } from '../../constants';

export interface UserBioInfoProps {
  user: UserMe;
  onEditProfile?: () => void;
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

export function UserBioInfo({ user, onEditProfile }: UserBioInfoProps) {
  const router = useRouter();
  const { firstName, lastName } = extractNameAndFamily(user);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const displayName = fullName || user.name || 'کاربر این‌شاپ';
  const phoneNumber = user.profile?.phoneNumber;
  const nationalId = user.nationalId || user.profile?.nationalIdNumber;
  const birthDate = user.birthDatePersian;
  const bio = (user.description || user.businessData?.bio || '').trim();
  const province = user.profile?.province?.trim();
  const city = user.profile?.city?.trim();
  const location = [province, city].filter(Boolean).join('، ');

  const hasAnyAccessibility = Boolean(
    user.usesWheelchair || user.isBlindOrLowVision || user.isDeafOrHardOfHearing
  );

  const handleEdit = () => {
    if (onEditProfile) {
      onEditProfile();
    } else {
      router.push(PROFILE_ROUTES.edit);
    }
  };

  const handleCopyPhoneNumber = async () => {
    if (!phoneNumber) return;
    await copyToClipboard(phoneNumber, {
      onSuccess: () => toast.success('شماره تماس کپی شد'),
      onError: () => toast.error('خطا در کپی شماره تماس'),
    });
  };

  return (
    <div className="flex flex-col text-right w-full" dir="rtl">
      {/* 1. Hero Identity: Avatar & User Metadata */}
      <div className="flex items-center gap-4 py-1">
        <div className="size-20 rounded-full overflow-hidden bg-surface-l1 border-2 border-outline/20 flex items-center justify-center text-secondary shrink-0 shadow-xs">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={displayName}
              className="size-full object-cover"
            />
          ) : (
            <User className="size-9 text-secondary/60" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <h2 className="text-lg font-bold text-foreground truncate tracking-tight">
            {displayName}
          </h2>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-l1 border border-outline/25 text-[11px] font-semibold text-secondary">
              حساب کاربری شخصی
            </span>

            {phoneNumber && (
              <span
                className="text-xs font-semibold text-secondary/80 font-sans tracking-wide"
                dir="ltr"
              >
                {toPersianDigits(phoneNumber)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. User Bio / Description (if provided) */}
      {bio && (
        <div className="mt-3 text-right">
          <p className="text-[13px] text-secondary leading-6 whitespace-pre-wrap">
            {bio}
          </p>
        </div>
      )}

      {/* 3. Personal & Contact Details Card */}
      <div className="mt-3.5 rounded-2xl border border-outline/25 bg-surface-l3 p-3.5 shadow-raised space-y-3">
        <div className="flex items-center gap-1.5 pb-2 border-b border-outline/15 text-xs font-bold text-foreground">
          <ShieldCheck className="size-4 text-secondary/80" aria-hidden="true" />
          <span>اطلاعات هویتی و تماس</span>
        </div>

        <div className="space-y-2.5 divide-y divide-outline/10 text-xs">
          {/* نام و نام خانوادگی */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-secondary">
              <div className="size-7 rounded-lg bg-surface-l1 flex items-center justify-center text-secondary/70 shrink-0">
                <User className="size-3.5" aria-hidden="true" />
              </div>
              <span className="font-medium text-[11px]">نام و نام خانوادگی</span>
            </div>
            <span className="font-bold text-foreground text-xs truncate max-w-[55%]">
              {displayName}
            </span>
          </div>

          {/* شماره تماس همراه */}
          {phoneNumber && (
            <div className="flex items-center justify-between pt-2.5">
              <div className="flex items-center gap-2 text-secondary">
                <div className="size-7 rounded-lg bg-surface-l1 flex items-center justify-center text-secondary/70 shrink-0">
                  <Phone className="size-3.5" aria-hidden="true" />
                </div>
                <span className="font-medium text-[11px]">شماره تماس</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-bold text-foreground text-xs" dir="ltr">
                  {toPersianDigits(phoneNumber)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyPhoneNumber}
                  title="کپی شماره تماس"
                  aria-label="کپی شماره تماس"
                  className="size-6 rounded-md text-secondary hover:text-foreground hover:bg-surface-l1 transition-colors"
                >
                  <Copy className="size-3" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {/* کد ملی */}
          {nationalId && (
            <div className="flex items-center justify-between pt-2.5">
              <div className="flex items-center gap-2 text-secondary">
                <div className="size-7 rounded-lg bg-surface-l1 flex items-center justify-center text-secondary/70 shrink-0">
                  <CreditCard className="size-3.5" aria-hidden="true" />
                </div>
                <span className="font-medium text-[11px]">کد ملی</span>
              </div>
              <span className="font-sans font-bold text-foreground text-xs" dir="ltr">
                {toPersianDigits(nationalId)}
              </span>
            </div>
          )}

          {/* تاریخ تولد */}
          {birthDate && (
            <div className="flex items-center justify-between pt-2.5">
              <div className="flex items-center gap-2 text-secondary">
                <div className="size-7 rounded-lg bg-surface-l1 flex items-center justify-center text-secondary/70 shrink-0">
                  <Calendar className="size-3.5" aria-hidden="true" />
                </div>
                <span className="font-medium text-[11px]">تاریخ تولد</span>
              </div>
              <span className="font-sans font-bold text-foreground text-xs">
                {formatPersianDisplayDate(birthDate)}
              </span>
            </div>
          )}

          {/* استان و شهر */}
          {location && (
            <div className="flex items-center justify-between pt-2.5">
              <div className="flex items-center gap-2 text-secondary">
                <div className="size-7 rounded-lg bg-surface-l1 flex items-center justify-center text-secondary/70 shrink-0">
                  <MapPin className="size-3.5" aria-hidden="true" />
                </div>
                <span className="font-medium text-[11px]">استان و شهر</span>
              </div>
              <span className="font-bold text-foreground text-xs truncate max-w-[55%]">
                {location}
              </span>
            </div>
          )}
        </div>

        {/* 4. Accessibility Preferences */}
        {hasAnyAccessibility && (
          <div className="pt-3 border-t border-outline/15 flex flex-col gap-2">
            <span className="text-[11px] font-medium text-secondary">
              تنظیمات دسترسی‌پذیری
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {user.usesWheelchair && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-l1 border border-outline/25 rounded-full text-xs font-medium text-foreground shadow-2xs">
                  <Accessibility className="size-3.5 text-foreground" aria-hidden="true" />
                  <span>ویلچر</span>
                </span>
              )}
              {user.isBlindOrLowVision && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-l1 border border-outline/25 rounded-full text-xs font-medium text-foreground shadow-2xs">
                  <Eye className="size-3.5 text-foreground" aria-hidden="true" />
                  <span>کم‌بینا</span>
                </span>
              )}
              {user.isDeafOrHardOfHearing && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-l1 border border-outline/25 rounded-full text-xs font-medium text-foreground shadow-2xs">
                  <VolumeX className="size-3.5 text-foreground" aria-hidden="true" />
                  <span>کم‌شنوا</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* 5. Edit Profile Button inside the information card */}
        <div className="pt-2 border-t border-outline/15">
          <Button
            id="user-profile-edit-btn"
            variant="filled"
            onClick={handleEdit}
            className="w-full h-11 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
          >
            <Edit3 className="size-4" aria-hidden="true" />
            <span>ویرایش مشخصات</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
