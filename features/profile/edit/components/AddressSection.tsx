'use client';

import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PROFILE_LIMITS, text } from '../../constants';
import FormSection from './FormSection';
import { Controller, useFormContext } from 'react-hook-form';
import { profileSchemaType } from '../editProfileSchema';

export default function AddressSection() {
  const { register, control, formState: { errors } } = useFormContext<profileSchemaType>();

  return (
    <FormSection.Root>
      <FormSection.Title icon={<MapPin className="size-4" />}>
        {text.edit.addressSectionTitle}
      </FormSection.Title>

      <FormSection.Field
        label={text.edit.addressLabel}
        htmlFor="profile-address"
        error={errors.address?.message as string}
      >
        <Input
          id="profile-address"
          inputSize="sm"
          placeholder={text.edit.addressPlaceholder}
          maxLength={PROFILE_LIMITS.address.max}
          {...register('address')}
        />
      </FormSection.Field>

      <div className="flex items-center justify-between gap-3 border-t border-container-base pt-2">
        <label htmlFor="profile-show-address" className="cursor-pointer text-xs font-bold text-primary">
          {text.edit.showAddressLabel}
        </label>

        <Controller
          name="addressShow"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Switch
              id="profile-show-address"
              checked={value}
              onCheckedChange={onChange}
            />
          )}
        />
      </div>
    </FormSection.Root>
  );
}
