'use client';

import { useFormContext } from 'react-hook-form';
import { CheckCircle2, Loader2, Store, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { text } from '../../constants';
import { useUser } from '../../context/UserContext';
import { profileSchemaType } from '../editProfileSchema';
import { useUsernameAvailability } from '../hooks/useUsernameAvailability';
import FormSection from './FormSection';

interface UsernameAvailabilityStatusProps {
  isLoading: boolean;
  isAvailable?: boolean;
  hasChecked: boolean;
}

function UsernameAvailabilityStatus({
  isLoading,
  isAvailable,
  hasChecked,
}: UsernameAvailabilityStatusProps) {
  if (isLoading) {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }

  if (!hasChecked) {
    return null;
  }

  if (isAvailable) {
    return <CheckCircle2 className="size-4 text-emerald-500" />;
  }

  return <XCircle className="size-4 text-destructive" />;
}

export default function ShopSection() {
  const { user } = useUser();
  const {
    register,
    formState: { errors },
  } = useFormContext<profileSchemaType>();
  const availability = useUsernameAvailability(user?.sellerProfile?.username);

  return (
    <FormSection.Root>
      <FormSection.Title icon={<Store className="size-4" />}>
        {text.edit.shopSectionTitle}
      </FormSection.Title>

      <FormSection.Field
        label={text.edit.shopNameLabel}
        htmlFor="profile-shop-name"
        isRequired
        error={errors.shopName?.message as string | ''}
      >
        <Input
          id="profile-shop-name"
          inputSize="sm"
          placeholder={text.edit.shopNamePlaceholder}
          {...register('shopName')}
        />
      </FormSection.Field>

      <FormSection.Field
        label={text.edit.handleLabel}
        htmlFor="profile-username"
        helperText={text.edit.handleHelper}
        error={availability.error}
        isRequired
      >
        <div className="relative flex items-center group" dir="ltr">
          <span className="pointer-events-none absolute left-3 text-xs text-secondary/70 transition-colors duration-300 group-focus-within:text-zinc-950 select-none">
            @
          </span>
          <Input
            id="profile-username"
            dir="ltr"
            inputSize="sm"
            placeholder={text.edit.handlePlaceholder}
            className="pl-7 pr-8 font-mono tracking-wider"
            {...register('username')}
          />
          <div className="absolute right-2.5 flex items-center pointer-events-none">
            <UsernameAvailabilityStatus
              isLoading={availability.isLoading}
              isAvailable={availability.isAvailable}
              hasChecked={availability.hasChecked}
            />
          </div>
        </div>
      </FormSection.Field>
    </FormSection.Root>
  );
}
