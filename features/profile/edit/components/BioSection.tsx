'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { PROFILE_LIMITS, text } from '../../constants';
import type { ProfileFormValues } from '../../schemas/profileSchema';
import FormSection from './FormSection';

export default function BioSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProfileFormValues>();

  // Scoped subscription: only the counter re-renders as the seller types.
  const bio = useWatch({ control, name: 'bio' });

  return (
    <FormSection.Root>
      <FormSection.Title icon={<FileText className="size-4" />}>
        {text.edit.bioSectionTitle}
      </FormSection.Title>

      {/* Textarea renders its own error/helper slot, so Field only owns the label. */}
      <FormSection.Field label={text.edit.bioLabel} htmlFor="profile-bio" hideMessageSlot>
        <Textarea
          id="profile-bio"
          rows={4}
          textareaSize="sm"
          placeholder={text.edit.bioPlaceholder}
          isError={!!errors.bio}
          errorMessage={errors.bio?.message}
          aria-invalid={!!errors.bio}
          maxLength={PROFILE_LIMITS.bio.max}
          {...register('bio')}
        />
        <span className="px-1 text-left text-[10px] text-secondary/70">
          {text.edit.bioCounter(bio?.length ?? 0, PROFILE_LIMITS.bio.max)}
        </span>
      </FormSection.Field>
    </FormSection.Root>
  );
}
