'use client';

import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UserMe } from '@/features/profile/services/profileService';
import {
  accountSchema,
  type accountSchemaInput,
  type accountSchemaType,
  generateDefaultAccountValues,
} from './accountSchema';
import { AccountPersonalInfoSection } from './components/AccountPersonalInfoSection';
import { AccountAccessibilitySection } from './components/AccountAccessibilitySection';

export interface UserAccountFormProps {
  user: UserMe | null;
  formId?: string;
  onSubmit: (data: accountSchemaType) => void;
  formMethods?: UseFormReturn<accountSchemaInput, unknown, accountSchemaType>;
}

export function UserAccountForm({
  user,
  formId = 'edit-account-form',
  onSubmit,
  formMethods,
}: UserAccountFormProps) {
  const internalMethods = useForm<accountSchemaInput, unknown, accountSchemaType>({
    resolver: zodResolver(accountSchema),
    mode: 'onChange',
    values: generateDefaultAccountValues(user),
    resetOptions: { keepDirtyValues: false },
  });

  const methods = formMethods ?? internalMethods;
  const handleSubmit = methods.handleSubmit(onSubmit);

  return (
    <FormProvider {...methods}>
      <form id={formId} noValidate onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
        <AccountPersonalInfoSection />
        <AccountAccessibilitySection />
      </form>
    </FormProvider>
  );
}

