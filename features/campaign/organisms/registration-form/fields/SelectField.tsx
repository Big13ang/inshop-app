'use client';

import { useId } from 'react';
import { Controller, FieldPath, useFormContext } from 'react-hook-form';

import { Label } from '@/features/campaign/ui/label';
import { CustomSearchableSelect } from '../CustomSearchableSelect';
import { ErrorMessage } from '../ErrorMessage';
import { RegistrationData } from '../schema';
import { saveRegistrationDraft } from '../draftStorage';

type SelectOption = string | { id: string; title: string };

interface SelectFieldProps<T extends SelectOption> {
  name: FieldPath<RegistrationData>;
  label: string;
  options: T[];
  placeholder: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}

export const SelectField = <T extends SelectOption>({
  name,
  label,
  options,
  placeholder,
  disabled,
  onValueChange,
}: SelectFieldProps<T>) => {
  const generatedId = useId();
  const labelId = `${name}-${generatedId}-label`;
  const errorId = `${name}-${generatedId}-error`;
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext<RegistrationData>();
  const error = errors[name]?.message as string | undefined;

  const handleChange = (value: string, onFieldChange: (value: string) => void) => {
    onFieldChange(value);
    onValueChange?.(value);
    saveRegistrationDraft(getValues());
  };

  return (
    <div className="space-y-3">
      <Label id={labelId} className="text-stone-900 text-base font-bold px-1 block">
        {label}
        <span className="text-rose-600" aria-label="الزامی">*</span>
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <CustomSearchableSelect
            options={options}
            value={field.value ?? ''}
            onChange={(value) => handleChange(value, field.onChange)}
            placeholder={placeholder}
            disabled={disabled}
            error={!!error}
            ariaLabelledBy={labelId}
            ariaDescribedBy={error ? errorId : undefined}
          />
        )}
      />
      <ErrorMessage id={errorId} message={error} />
    </div>
  );
};
