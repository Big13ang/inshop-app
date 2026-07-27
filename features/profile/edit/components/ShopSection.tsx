'use client';

import { useEffect, type ChangeEvent } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Check, LoaderCircle, Store, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { text } from '../../constants';
import type { ProfileFormValues } from '../../schemas/profileSchema';
import { profileService } from '../../services/profileService';
import FormSection from './FormSection';

const USERNAME_CHECKING_MESSAGE =
  '\u062f\u0631 \u062d\u0627\u0644 \u0628\u0631\u0631\u0633\u06cc \u0622\u06cc\u062f\u06cc...';
const USERNAME_CHECK_FAILED_MESSAGE =
  '\u0628\u0631\u0631\u0633\u06cc \u0622\u06cc\u062f\u06cc \u0627\u0646\u062c\u0627\u0645 \u0646\u0634\u062f. \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.';
const USERNAME_TAKEN_MESSAGE =
  '\u0627\u06cc\u0646 \u0622\u06cc\u062f\u06cc \u0642\u0628\u0644\u0627 \u062b\u0628\u062a \u0634\u062f\u0647 \u0627\u0633\u062a';
const USERNAME_AVAILABLE_MESSAGE =
  '\u0627\u06cc\u0646 \u0622\u06cc\u062f\u06cc \u062f\u0631 \u062f\u0633\u062a\u0631\u0633 \u0627\u0633\u062a';

export default function ShopSection() {
  const {
    register,
    getValues,
    setValue,
    setError,
    clearErrors,
    control,
    formState: { errors, defaultValues },
  } = useFormContext<ProfileFormValues>();

  const initialUsername = (defaultValues?.username || getValues('username') || '').trim();
  const username = useWatch({ control, name: 'username' }) || '';
  const currentUsername = username.trim();
  const debouncedUsername = useDebounce(currentUsername, 300);

  const isChanged =
    debouncedUsername.length >= 3 &&
    debouncedUsername.toLowerCase() !== initialUsername.toLowerCase();

  const isTyping =
    currentUsername.length >= 3 &&
    currentUsername.toLowerCase() !== debouncedUsername.toLowerCase();

  const { data: checkResult, isError: isUsernameCheckError, isFetching } =
    profileService.useCheckUsername(debouncedUsername, { enabled: isChanged });

  const isCheckingUsername = isTyping || isFetching;

  const isMatchingResult =
    checkResult &&
    checkResult.username.toLowerCase() === debouncedUsername.toLowerCase();

  useEffect(() => {
    if (!isChanged) {
      clearErrors('username');
      return;
    }

    if (isUsernameCheckError) {
      setError('username', {
        type: 'manual',
        message: USERNAME_CHECK_FAILED_MESSAGE,
      });
      return;
    }

    if (isMatchingResult) {
      if (!checkResult.available) {
        setError('username', {
          type: 'manual',
          message: USERNAME_TAKEN_MESSAGE,
        });
      } else {
        clearErrors('username');
      }
    }
  }, [isChanged, isMatchingResult, isUsernameCheckError, checkResult, setError, clearErrors]);

  const isUsernameAvailable =
    isChanged && !isCheckingUsername && isMatchingResult ? checkResult.available : null;
  const isUsernameUnavailable = isUsernameAvailable === false;
  const shouldShowHandleHelper =
    !isCheckingUsername &&
    !isUsernameAvailable &&
    !isUsernameUnavailable &&
    !errors.username;

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextUsername = event.target.value;
    setValue('username', nextUsername, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleUsernameBlur = () => {
    setValue('username', username, {
      shouldDirty: username.trim().toLowerCase() !== initialUsername.toLowerCase(),
      shouldTouch: true,
      shouldValidate: true,
    });
  };

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
        helperText={shouldShowHandleHelper ? text.edit.handleHelper : undefined}
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
            name="username"
            dir="ltr"
            inputSize="sm"
            placeholder={text.edit.handlePlaceholder}
            isError={!!errors.username}
            aria-invalid={!!errors.username}
            className="pl-7 pr-8 font-mono tracking-wider"
            value={username}
            onBlur={handleUsernameBlur}
            onChange={handleUsernameChange}
          />
          <div className="absolute right-2.5 flex items-center pointer-events-none">
            {isCheckingUsername ? (
              <LoaderCircle className="size-4 animate-spin text-zinc-400" />
            ) : isUsernameAvailable === true ? (
              <Check className="size-4 text-emerald-500" />
            ) : isUsernameUnavailable ? (
              <XCircle className="size-4 text-error" />
            ) : null}
          </div>
        </div>
        {isCheckingUsername && (
          <p className="mt-1 text-[11px] font-medium text-secondary" aria-live="polite">
            {USERNAME_CHECKING_MESSAGE}
          </p>
        )}
        {isUsernameAvailable === true && (
          <p className="mt-1 text-[11px] font-medium text-emerald-600">
            {USERNAME_AVAILABLE_MESSAGE}
          </p>
        )}
      </FormSection.Field>
    </FormSection.Root>
  );
}
