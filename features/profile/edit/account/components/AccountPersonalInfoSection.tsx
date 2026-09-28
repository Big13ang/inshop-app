'use client';

import { User } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormSection } from '../../components/FormSection';
import type { accountSchemaType } from '../accountSchema';
import { AccountBirthDatePickerField } from './AccountBirthDatePickerField';

export function AccountPersonalInfoSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<accountSchemaType>();

  return (
    <FormSection.Root>
      <FormSection.Title icon={<User className="size-4" />}>
        اطلاعات فردی و شناسایی
      </FormSection.Title>

      {/* 1. First Name & Last Name (2 columns) */}
      <div className="grid grid-cols-2 gap-3">
        <FormSection.Field
          label="نام"
          htmlFor="account-first-name"
          isRequired
          error={errors.firstName?.message}
        >
          <Input
            id="account-first-name"
            inputSize="sm"
            placeholder="مثال: محمد"
            isError={Boolean(errors.firstName)}
            {...register('firstName')}
          />
        </FormSection.Field>

        <FormSection.Field
          label="نام خانوادگی"
          htmlFor="account-last-name"
          isRequired
          error={errors.lastName?.message}
        >
          <Input
            id="account-last-name"
            inputSize="sm"
            placeholder="مثال: رضایی"
            isError={Boolean(errors.lastName)}
            {...register('lastName')}
          />
        </FormSection.Field>
      </div>

      {/* 2. National ID */}
      <FormSection.Field
        label="کد ملی"
        htmlFor="account-national-id"
        isRequired
        helperText="کد ملی باید ۱۰ رقم و منطبق با مشخصات صاحب حساب و شماره موبایل باشد."
        error={errors.nationalId?.message}
      >
        <Input
          id="account-national-id"
          inputSize="sm"
          placeholder="کد ملی ۱۰ رقمی"
          maxLength={10}
          dir="ltr"
          isError={Boolean(errors.nationalId)}
          className="font-mono tracking-widest text-left"
          {...register('nationalId')}
        />
      </FormSection.Field>

      {/* 3. Birth Date with Controller */}
      <FormSection.Field
        label="تاریخ تولد"
        htmlFor="account-birth-date"
        error={errors.birthDatePersian?.message}
      >
        <Controller
          name="birthDatePersian"
          control={control}
          render={({ field: { value, onChange } }) => (
            <AccountBirthDatePickerField
              value={value}
              onChange={onChange}
            />
          )}
        />
      </FormSection.Field>
    </FormSection.Root>
  );
}
