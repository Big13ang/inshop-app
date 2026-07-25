'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PROFILE_LIMITS, text } from '../../constants';
import type { ProfileFormValues } from '../../schemas/profileSchema';
import FormSection from './FormSection';

export default function AddressSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProfileFormValues>();

  return (
    <FormSection.Root>
      <FormSection.Title icon={<MapPin className="size-4" />}>
        {text.edit.addressSectionTitle}
      </FormSection.Title>

      <FormSection.Field
        label={text.edit.addressLabel}
        htmlFor="profile-address"
        error={errors.address?.message}
      >
        <Input
          id="profile-address"
          inputSize="sm"
          placeholder={text.edit.addressPlaceholder}
          isError={!!errors.address}
          aria-invalid={!!errors.address}
          maxLength={PROFILE_LIMITS.address.max}
          {...register('address')}
        />
      </FormSection.Field>

      <div className="flex items-center justify-between gap-3 border-t border-container-base pt-2">
        <label htmlFor="profile-show-address" className="cursor-pointer text-xs font-bold text-primary">
          {text.edit.showAddressLabel}
        </label>

        <Controller
          control={control}
          name="showAddress"
          render={({ field }) => (
            <Switch
              id="profile-show-address"
              checked={field.value}
              onCheckedChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
            />
          )}
        />
      </div>
    </FormSection.Root>
  );
}
