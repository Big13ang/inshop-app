'use client';

import { Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { text } from '../../constants';
import FormSection from './FormSection';
import { useFormContext } from 'react-hook-form';
import { profileSchemaType } from '../editProfileSchema';

export default function ContactSection() {
  const { register, formState: { errors } } = useFormContext<profileSchemaType>();

  return (
    <FormSection.Root>
      <FormSection.Title icon={<Phone className="size-4" />}>
        {text.edit.contactSectionTitle}
      </FormSection.Title>

      <FormSection.Field
        label={text.edit.phoneLabel}
        htmlFor="profile-phone"
        isRequired
        helperText={text.edit.phoneHelper}
        error={errors.shopPhoneNumber?.message}
      >
        <Input
          id="profile-phone"
          type="tel"
          dir="ltr"
          inputMode="numeric"
          autoComplete="tel"
          inputSize="sm"
          placeholder={text.edit.phonePlaceholder}
          className="font-mono tracking-widest"
          {...register('shopPhoneNumber')}
        />
      </FormSection.Field>
    </FormSection.Root>
  );
}
