'use client';

import { InstagramIcon } from '@/components/icons/InstagramIcon';
import { useFormContext } from 'react-hook-form';
import { toEnglishDigits } from '@/components/ui/PersianDatePicker/persianDateUtils';
import { Input } from '@/components/ui/input';
import { text } from '../../constants';
import { profileSchemaType } from '../editProfileSchema';
import FormSection from './FormSection';

export function EditShopSocialInputs() {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<profileSchemaType>();

  const followerField = register('followerCount');

  const handleFollowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = toEnglishDigits(e.target.value).replace(/\D/g, '');
    followerField.onChange(e);
  };

  const handleInstagramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('instagram', e.target.value.replace(/^@/, ''), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <FormSection.Root>
      <FormSection.Title icon={<InstagramIcon className="size-4" />}>
        {text.edit.socialSectionTitle}
      </FormSection.Title>

      <FormSection.Field
        label={text.edit.followerCountLabel}
        htmlFor="edit-shop-follower-count"
        error={errors.followerCount?.message as string | undefined}
      >
        <Input
          id="edit-shop-follower-count"
          type="text"
          inputMode="numeric"
          inputSize="sm"
          placeholder={text.edit.followerCountPlaceholder}
          {...followerField}
          onChange={handleFollowerChange}
        />
      </FormSection.Field>

      <FormSection.Field
        label={text.edit.instagramLabel}
        htmlFor="edit-shop-instagram"
        error={errors.instagram?.message as string | undefined}
      >
        <div className="relative flex items-center group" dir="ltr">
          <span className="pointer-events-none absolute left-3 text-xs text-secondary/70 transition-colors duration-300 group-focus-within:text-zinc-950 select-none">
            @
          </span>
          <Input
            id="edit-shop-instagram"
            dir="ltr"
            inputSize="sm"
            placeholder={text.edit.instagramPlaceholder}
            className="pl-7 font-mono tracking-wider"
            {...register('instagram')}
            onChange={handleInstagramChange}
          />
        </div>
      </FormSection.Field>
    </FormSection.Root>
  );
}
