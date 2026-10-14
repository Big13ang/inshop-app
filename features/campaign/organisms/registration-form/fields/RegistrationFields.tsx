'use client';

import { useId } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import { Textarea } from '@/features/campaign/ui/textarea';
import { Label } from '@/features/campaign/ui/label';
import {
  CITIES,
  FOLLOWER_RANGES,
  PRODUCT_CATEGORIES,
  PROVINCES,
} from '@/features/campaign/constants/registration';
import { cn } from '@/lib/utils';
import { ErrorMessage } from '../ErrorMessage';
import {
  DESCRIPTION_MAX_LENGTH,
  FIELD_MAX_LENGTH,
  NAME_MAX_LENGTH,
  RegistrationData,
} from '../schema';
import { saveRegistrationDraft } from '../draftStorage';
import { SelectField } from './SelectField';
import { TextField } from './TextField';

export const FirstNameField = () => (
  <TextField
    name="firstName"
    label="نام"
    maxLength={NAME_MAX_LENGTH}
    autoComplete="given-name"
    placeholder="مثال: علی"
  />
);

export const LastNameField = () => (
  <TextField
    name="lastName"
    label="نام خانوادگی"
    maxLength={NAME_MAX_LENGTH}
    autoComplete="family-name"
    placeholder="مثال: علوی"
  />
);

export const PhoneNumberField = () => (
  <TextField
    name="mobile"
    label="شماره موبایل"
    maxLength={11}
    autoComplete="tel"
    type="tel"
    dir="ltr"
    placeholder="09123456789"
    transform={(value) => value.replace(/\D/g, '').slice(0, 11)}
    className="tracking-widest text-lg"
    hint="فقط اعداد انگلیسی"
  />
);

export const NationalIdField = () => (
  <TextField
    name="nationalId"
    label="کد ملی"
    maxLength={10}
    autoComplete="off"
    dir="ltr"
    placeholder="1234567890"
    transform={(value) => value.replace(/\D/g, '')}
    className="tracking-widest text-lg"
    hint="فقط اعداد انگلیسی"
  />
);

export const ProvinceField = () => {
  const { setValue } = useFormContext<RegistrationData>();

  const clearCity = () => {
    setValue('city', '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  };

  return (
    <SelectField
      name="province"
      label="استان"
      options={PROVINCES}
      placeholder="انتخاب استان"
      onValueChange={clearCity}
    />
  );
};

export const CityField = () => {
  const { control } = useFormContext<RegistrationData>();
  const selectedProvince = useWatch({ control, name: 'province' });

  return (
    <SelectField
      name="city"
      label="شهر"
      options={selectedProvince ? CITIES[selectedProvince] || [] : []}
      placeholder={selectedProvince ? 'انتخاب شهر' : 'ابتدا استان را انتخاب کنید'}
      disabled={!selectedProvince}
    />
  );
};

export const StoreIdField = () => (
  <TextField
    name="storeId"
    label="آیدی پیج اینستاگرام"
    maxLength={FIELD_MAX_LENGTH}
    autoComplete="off"
    dir="ltr"
    placeholder="yourstore_123"
    transform={(value) => value.replace(/[^a-zA-Z0-9_.]/g, '')}
    prefix="@"
    className="tracking-wide text-lg pl-10"
  />
);

export const FollowersField = () => (
  <SelectField
    name="followers"
    label="فالوئر شما"
    options={FOLLOWER_RANGES}
    placeholder="انتخاب بازه"
  />
);


export const CategoryField = () => (
  <SelectField
    name="category"
    label="نوع فروشگاه"
    options={PRODUCT_CATEGORIES}
    placeholder="انتخاب دسته‌بندی"
  />
);

export const DescriptionField = () => {
  const inputId = `description-${useId()}`;
  const errorId = `${inputId}-error`;
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext<RegistrationData>();

  const handleChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
    onFieldChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  ) => {
    onFieldChange(event);
    saveRegistrationDraft(getValues());
  };

  return (
    <div className="space-y-4">
      <Label htmlFor={inputId} className="text-stone-900 text-base font-bold px-1 block">
        درباره فروشگاه شما
        <span className="text-rose-600" aria-label="الزامی">*</span>
      </Label>
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Textarea
            {...field}
            id={inputId}
            value={field.value ?? ''}
            onChange={(event) => handleChange(event, field.onChange)}
            maxLength={DESCRIPTION_MAX_LENGTH}
            placeholder="درباره محصولات، سوابق فعالیت و اهداف فروشگاه خود بنویسید..."
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? errorId : undefined}
            required
            className={cn(
              'min-h-[160px] font-medium leading-relaxed focus:border-rose-600 focus:ring-4 focus:ring-rose-600/10 transition-all text-sm md:text-base',
              errors.description && 'border-rose-500 bg-rose-50/10 focus:ring-rose-200'
            )}
          />
        )}
      />
      <ErrorMessage id={errorId} message={errors.description?.message} />
    </div>
  );
};
