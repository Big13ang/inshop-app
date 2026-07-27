'use client';

import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Check, LoaderCircle, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { text } from '../../constants';
import type { ProfileFormValues } from '../../schemas/profileSchema';
import { profileService } from '../../services/profileService';
import FormSection from './FormSection';

export default function ShopSection() {
  const {
    register,
    control,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext<ProfileFormValues>();

  const usernameValue = useWatch({ control, name: 'username' });
  const initialUsernameRef = useRef<string | null>(null);

  if (initialUsernameRef.current === null) {
    initialUsernameRef.current = getValues('username') || '';
  }

  const isChanged = (usernameValue || '').trim() !== initialUsernameRef.current.trim();

  const { data: checkResult, isFetching: isCheckingUsername } =
    profileService.useCheckUsername(usernameValue || '', { enabled: isChanged });

  useEffect(() => {
    if (!isChanged) {
      clearErrors('username');
      return;
    }

    if (checkResult && !checkResult.available) {
      setError('username', {
        type: 'manual',
        message: 'این نام کاربری قبلا ثبت شده است',
      });
    } else if (checkResult && checkResult.available) {
      clearErrors('username');
    }
  }, [isChanged, checkResult, setError, clearErrors]);

  const isUsernameAvailable = isChanged && checkResult ? checkResult.available : null;

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
        error={errors.username?.message}
        helperText={isUsernameAvailable ? undefined : text.edit.handleHelper}
      >
        <div className="relative flex items-center group" dir="ltr">
          <span
            className={cn(
              'pointer-events-none absolute left-3 text-xs text-secondary/70 transition-colors duration-300 group-focus-within:text-zinc-950 select-none',
              errors.username && 'text-red-400 group-focus-within:text-red-500'
            )}
          >
            @
          </span>
          <Input
            id="profile-handle"
            dir="ltr"
            inputSize="sm"
            placeholder={text.edit.handlePlaceholder}
            isError={!!errors.username}
            aria-invalid={!!errors.username}
            className="pl-7 pr-8 font-mono tracking-wider"
            {...register('username')}
          />
          <div className="absolute right-2.5 flex items-center pointer-events-none">
            {isCheckingUsername ? (
              <LoaderCircle className="size-4 animate-spin text-zinc-400" />
            ) : isUsernameAvailable === true ? (
              <Check className="size-4 text-emerald-500" />
            ) : null}
          </div>
        </div>
        {isUsernameAvailable === true && (
          <p className="mt-1 text-[11px] font-medium text-emerald-600">
            نام کاربری در دسترس است
          </p>
        )}
      </FormSection.Field>
    </FormSection.Root>
  );
}
