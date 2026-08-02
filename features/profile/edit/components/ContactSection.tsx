'use client';

import { Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { text } from '../../constants';
import FormSection from './FormSection';

export default function ContactSection() {
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
        />
      </FormSection.Field>
    </FormSection.Root>
  );
}
