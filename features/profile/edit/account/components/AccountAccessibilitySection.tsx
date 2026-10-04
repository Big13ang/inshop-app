'use client';

import { Accessibility, Eye, VolumeX } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import { FormSection } from '../../components/FormSection';
import type { accountSchemaType } from '../accountSchema';
import { AccountAccessibilityCard } from './AccountAccessibilityCard';

export function AccountAccessibilitySection() {
  const { control } = useFormContext<accountSchemaType>();

  return (
    <FormSection.Root>
      <div className="border-b border-container-base pb-2">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-secondary" aria-hidden="true">
            <Accessibility className="size-4" />
          </span>
          <div>
            <h2 className="text-xs font-bold text-secondary">دسترسی‌پذیری</h2>
            <p className="text-[10px] text-secondary/70 mt-0.5">
              تعیین نیازهای ویژه جهت سهولت در تحویل مرسوله و هماهنگی
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Wheelchair */}
        <Controller
          name="usesWheelchair"
          control={control}
          render={({ field: { value, onChange } }) => (
            <AccountAccessibilityCard
              id="accessibility-wheelchair-card"
              title="از ویلچر استفاده می‌کنم"
              description="تحویل بسته بدون پله یا با رمپ اختصاصی"
              icon={<Accessibility className="size-3.5" />}
              checked={Boolean(value)}
              onToggle={() => onChange(!value)}
            />
          )}
        />

        {/* Visually Impaired */}
        <Controller
          name="isBlindOrLowVision"
          control={control}
          render={({ field: { value, onChange } }) => (
            <AccountAccessibilityCard
              id="accessibility-visual-card"
              title="نابینا یا کم‌بینا هستم"
              description="ارسال پیام صوتی و هماهنگی تلفنی برای تحویل"
              icon={<Eye className="size-3.5" />}
              checked={Boolean(value)}
              onToggle={() => onChange(!value)}
            />
          )}
        />

        {/* Hearing Impaired */}
        <Controller
          name="isDeafOrHardOfHearing"
          control={control}
          render={({ field: { value, onChange } }) => (
            <AccountAccessibilityCard
              id="accessibility-hearing-card"
              title="ناشنوا یا کم‌شنوا هستم"
              description="هماهنگی فقط از طریق پیامک و چت"
              icon={<VolumeX className="size-3.5" />}
              checked={Boolean(value)}
              onToggle={() => onChange(!value)}
            />
          )}
        />
      </div>
    </FormSection.Root>
  );
}
