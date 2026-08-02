'use client';

import { useFormContext } from 'react-hook-form';
import { Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { text } from '../../constants';
import type { ProfileFormValues } from '../../schemas/profileSchema';
import FormSection from './FormSection';

export default function ContactSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProfileFormValues>();

  return (
    <FormSection.Root>
      <FormSection.Title icon={<Phone className="size-4" />}>
        {text.edit.contactSectionTitle}
      </FormSection.Title>

      <FormSection.Field
        label={text.edit.phoneLabel}
        htmlFor="profile-phone"
        isRequired
        error={errors.phoneNumber?.message}
        helperText={text.edit.phoneHelper}
      >
        <Input
          id="profile-phone"
          type="tel"
          dir="ltr"
          inputMode="numeric"
          autoComplete="tel"
          inputSize="sm"
          placeholder={text.edit.phonePlaceholder}
          isError={!!errors.phoneNumber}
          aria-invalid={!!errors.phoneNumber}
          className="font-mono tracking-widest"
          {...register('phoneNumber')}
        />
      </FormSection.Field>
    </FormSection.Root>
  );
}
