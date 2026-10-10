'use client';

import { useState } from 'react';
import { Check, Copy, Phone, PhoneCall, PhoneOff, Smartphone, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/button';
import { toEnglishDigits, toPersianDigits } from '@/components/ui/PersianDatePicker/persianDateUtils';
import { copyToClipboard } from '@/lib/utils/copyToClipboard';
import { text } from '../../constants';
import type { PublicSellerProfile, SellerProfile } from '../../services/profileService';

export interface StoreContactPhone {
  phoneNumber: string;
  label: string;
  type: 'mobile' | 'landline' | 'other';
}

const IRANIAN_MOBILE_REGEX = /^09\d{9}$/;
const IRANIAN_LANDLINE_REGEX = /^0[1-8]\d{8,10}$/;

export function normalizePhoneNumber(rawNumber?: string | null): string | null {
  if (!rawNumber) return null;

  const digits = toEnglishDigits(rawNumber).trim().replace(/[\s\-()]/g, '');
  if (!digits) return null;

  if (digits.startsWith('+98')) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith('0098')) {
    return `0${digits.slice(4)}`;
  }
  if (digits.startsWith('98') && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }

  return digits;
}

export function resolvePhoneType(phoneNumber: string): 'mobile' | 'landline' | 'other' {
  if (IRANIAN_MOBILE_REGEX.test(phoneNumber)) return 'mobile';
  if (IRANIAN_LANDLINE_REGEX.test(phoneNumber)) return 'landline';
  return 'other';
}

export function resolvePhoneLabel(
  type: 'mobile' | 'landline' | 'other',
  customLabel?: string | null
): string {
  const trimmed = customLabel?.trim();
  if (trimmed && trimmed !== 'فروشگاه') {
    return trimmed;
  }

  switch (type) {
    case 'mobile':
      return text.overview.contactMobileLabel;
    case 'landline':
      return text.overview.contactLandlineLabel;
    default:
      return text.overview.contactOtherLabel;
  }
}

export function createStoreContactPhone(
  rawNumber?: string | null,
  customLabel?: string | null
): StoreContactPhone | null {
  const normalized = normalizePhoneNumber(rawNumber);
  if (!normalized) return null;

  const type = resolvePhoneType(normalized);
  const label = resolvePhoneLabel(type, customLabel);

  return {
    phoneNumber: normalized,
    label,
    type,
  };
}

export function getStoreContactPhone(
  profile?: PublicSellerProfile | SellerProfile
): StoreContactPhone | null {
  if (!profile) return null;

  const rawNumber =
    ('shopPhoneNumber' in profile && profile.shopPhoneNumber) ||
    ('phones' in profile && profile.phones?.[0]?.phoneNumber) ||
    null;

  if (!rawNumber) return null;

  const customLabel =
    ('phones' in profile && profile.phones?.[0]?.label) || null;

  return createStoreContactPhone(rawNumber, customLabel);
}

export function getStoreContactPhones(
  profile?: PublicSellerProfile | SellerProfile
): StoreContactPhone[] {
  const phone = getStoreContactPhone(profile);
  return phone ? [phone] : [];
}

export function initiatePhoneCall(phoneNumber: string): void {
  if (typeof window !== 'undefined') {
    window.location.href = `tel:${phoneNumber}`;
  }
}

interface ContactPhoneRowProps {
  phone: StoreContactPhone;
  onCopy: (phoneNumber: string) => void;
  isCopied: boolean;
}

function ContactPhoneRow({ phone, onCopy, isCopied }: ContactPhoneRowProps) {
  const handleCopyClick = () => {
    onCopy(phone.phoneNumber);
  };

  return (
    <div
      data-testid="store-phone-card"
      className="flex w-full items-center justify-between rounded-2xl border border-primary/5 bg-surface-l1/70 p-3 transition-colors hover:bg-container-base select-none"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-l3 border border-primary/5 text-secondary shadow-xs">
          {phone.type === 'mobile' ? (
            <Smartphone className="size-5" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Phone className="size-5" strokeWidth={1.75} aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col text-right min-w-0">
          <span className="text-[11px] font-medium text-secondary truncate">
            {phone.label}
          </span>
          <span
            className="font-sans font-bold text-foreground text-[15px] tracking-wide mt-0.5"
            dir="ltr"
            data-testid="store-phone-number"
          >
            {toPersianDigits(phone.phoneNumber)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleCopyClick}
          className="size-9 rounded-xl border border-outline/30 text-secondary hover:text-foreground hover:bg-surface-l2 active:scale-90 shadow-xs"
          data-testid="copy-store-phone-btn"
          title={text.overview.contactCopyAction}
          aria-label={`${text.overview.contactCopyAction} ${phone.phoneNumber}`}
        >
          {isCopied ? (
            <Check className="size-4 text-emerald-600 animate-in zoom-in-75 duration-150" strokeWidth={2.25} />
          ) : (
            <Copy className="size-4" strokeWidth={1.75} />
          )}
        </Button>

        <a
          href={`tel:${phone.phoneNumber}`}
          className="inline-flex shrink-0"
          data-testid="call-store-phone-link"
          title={text.overview.contactCallAction}
          aria-label={`${text.overview.contactCallAction} ${phone.phoneNumber}`}
        >
          <Button
            type="button"
            variant="default"
            size="icon"
            className="size-9 rounded-xl shadow-xs active:scale-90"
          >
            <PhoneCall className="size-4" strokeWidth={1.75} />
          </Button>
        </a>
      </div>
    </div>
  );
}

interface ContactUnavailableStateProps {
  onClose: () => void;
}

function ContactUnavailableState({ onClose }: ContactUnavailableStateProps) {
  return (
    <div
      className="py-6 flex flex-col items-center justify-center text-center"
      data-testid="contact-store-unavailable"
    >
      <div className="size-11 rounded-full bg-surface-l1 border border-outline/25 flex items-center justify-center text-secondary mb-3 shadow-xs">
        <PhoneOff className="size-5 text-secondary/80" strokeWidth={1.75} />
      </div>

      <h4 className="text-sm font-bold text-foreground">
        {text.overview.contactUnavailableTitle}
      </h4>

      <p className="text-xs text-secondary mt-1.5 leading-relaxed max-w-xs font-medium">
        {text.overview.contactUnavailableDescription}
      </p>

      <Button
        type="button"
        variant="secondary"
        onClick={onClose}
        className="w-full mt-5 h-10 rounded-xl font-bold text-xs border border-outline/30 active:scale-98 transition-all"
        id="contact-store-unavailable-close-btn"
      >
        {text.overview.contactCloseAction}
      </Button>
    </div>
  );
}

export interface ContactStoreBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sellerProfile?: PublicSellerProfile | SellerProfile;
}

export function ContactStoreBottomSheet({
  isOpen,
  onClose,
  sellerProfile,
}: ContactStoreBottomSheetProps) {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const phone = getStoreContactPhone(sellerProfile);
  const shopName = sellerProfile?.shopName || text.overview.fallbackShopName;

  const handleCopy = async (phoneNumber: string) => {
    await copyToClipboard(phoneNumber, {
      onSuccess: () => {
        setCopiedNumber(phoneNumber);
        toast.success(text.overview.contactCopied);
        setTimeout(() => setCopiedNumber(null), 2000);
      },
      onError: () => toast.error(text.overview.contactCopyFailed),
    });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={handleClose}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content
          variant="drawer"
          className="pb-8 pt-1 px-4 font-sans select-none"
        >
          <div id="contact-store-bottomsheet" data-testid="contact-store-bottomsheet" dir="rtl" className="w-full">
            {/* Header with circular Close X button, centered title, and subtle bottom divider */}
            <div className="relative mb-3.5 flex items-center justify-center border-b border-container-base pb-3 px-1" dir="rtl">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                shape="circle"
                onClick={handleClose}
                aria-label={text.overview.contactCloseAction}
                className="absolute left-1 size-8 bg-surface-l1 hover:bg-container-base text-secondary hover:text-foreground active:scale-95"
                id="contact-store-close-btn"
              >
                <X className="size-4" strokeWidth={2} />
              </Button>

              <div className="flex flex-col items-center text-center">
                <h2 className="text-sm font-bold text-foreground">
                  {text.overview.contactModalTitle}
                </h2>
                {shopName ? (
                  <span className="text-[11px] text-secondary font-normal mt-0.5">
                    {text.overview.contactModalSubtitle(shopName)}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Content: Phone Card or Unavailable State */}
            {phone ? (
              <div className="pt-0.5" data-testid="contact-phones-list">
                <ContactPhoneRow
                  phone={phone}
                  onCopy={handleCopy}
                  isCopied={copiedNumber === phone.phoneNumber}
                />
              </div>
            ) : (
              <ContactUnavailableState onClose={handleClose} />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
