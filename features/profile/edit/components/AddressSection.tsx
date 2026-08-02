'use client';

import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PROFILE_LIMITS, text } from '../../constants';
import FormSection from './FormSection';

export default function AddressSection() {
  return (
    <FormSection.Root>
      <FormSection.Title icon={<MapPin className="size-4" />}>
        {text.edit.addressSectionTitle}
      </FormSection.Title>

      <FormSection.Field
        label={text.edit.addressLabel}
        htmlFor="profile-address"
      >
        <Input
          id="profile-address"
          inputSize="sm"
          placeholder={text.edit.addressPlaceholder}
          maxLength={PROFILE_LIMITS.address.max}
        />
      </FormSection.Field>

      <div className="flex items-center justify-between gap-3 border-t border-container-base pt-2">
        <label htmlFor="profile-show-address" className="cursor-pointer text-xs font-bold text-primary">
          {text.edit.showAddressLabel}
        </label>

        <Switch id="profile-show-address" defaultChecked />
      </div>
    </FormSection.Root>
  );
}
