'use client';

import { useFormContext } from 'react-hook-form';
import { Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { text } from '../../constants';
import type { ProfileFormValues } from '../../schemas/profileSchema';
import FormSection from './FormSection';

export default function ShopSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProfileFormValues>();

  return (
    <FormSection.Root>
      <FormSection.Title icon={<Store className="size-4" />}>
        {text.edit.shopSectionTitle}
      </FormSection.Title>

      <FormSection.Field
        label={text.edit.shopNameLabel}
        htmlFor="profile-shop-name"
        isRequired
        error={errors.shopName?.message}
      >
        <Input
          id="profile-shop-name"
          inputSize="sm"
          placeholder={text.edit.shopNamePlaceholder}
          isError={!!errors.shopName}
          aria-invalid={!!errors.shopName}
          {...register('shopName')}
        />
      </FormSection.Field>

      <FormSection.Field
        label={text.edit.handleLabel}
        htmlFor="profile-handle"
        error={errors.handle?.message}
        helperText={text.edit.handleHelper}
      >
        <div className="relative flex items-center group" dir="ltr">
          <span
            className={cn(
              'pointer-events-none absolute left-3 text-xs text-secondary/70 transition-colors duration-300 group-focus-within:text-zinc-950 select-none',
              errors.handle && 'text-red-400 group-focus-within:text-red-500'
            )}
          >
            @
          </span>
          <Input
            id="profile-handle"
            dir="ltr"
            inputSize="sm"
            placeholder={text.edit.handlePlaceholder}
            isError={!!errors.handle}
            aria-invalid={!!errors.handle}
            className="pl-7 font-mono tracking-wider"
            {...register('handle')}
          />
        </div>
      </FormSection.Field>
    </FormSection.Root>
  );
}
