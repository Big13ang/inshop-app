'use client';

import { FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { PROFILE_LIMITS, text } from '../../constants';
import FormSection from './FormSection';
import { useFormContext, useWatch } from 'react-hook-form';
import { profileSchemaType } from '../editProfileSchema';

export default function BioSection() {
  const { register, control, formState: { errors } } = useFormContext<profileSchemaType>();
  const bio = useWatch({ control, name: "bio" });

  return (
    <FormSection.Root>
      <FormSection.Title icon={<FileText className="size-4" />}>
        {text.edit.bioSectionTitle}
      </FormSection.Title>

      <FormSection.Field
        label={text.edit.bioLabel}
        htmlFor="profile-bio"
        error={errors.bio?.message as string}
      >
        <Textarea
          id="profile-bio"
          rows={4}
          textareaSize="sm"
          placeholder={text.edit.bioPlaceholder}
          maxLength={PROFILE_LIMITS.bio.max}
          {...register('bio')}
        />
        <span className="px-1 text-left text-[10px] text-secondary/70">
          {text.edit.bioCounter(bio?.length || 0, PROFILE_LIMITS.bio.max)}
        </span>
      </FormSection.Field>
    </FormSection.Root>
  );
}
