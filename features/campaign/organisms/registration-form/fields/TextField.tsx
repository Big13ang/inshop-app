'use client';

import { useId } from 'react';
import { Controller, FieldPath, useFormContext } from 'react-hook-form';

import { Input } from '@/features/campaign/ui/input';
import { Label } from '@/features/campaign/ui/label';
import { cn } from '@/lib/utils';
import { ErrorMessage } from '../ErrorMessage';
import { RegistrationData } from '../schema';
import { saveRegistrationDraft } from '../draftStorage';

interface TextFieldProps {
  name: FieldPath<RegistrationData>;
  label: string;
  placeholder: string;
  maxLength?: number;
  autoComplete?: string;
  type?: string;
  dir?: 'rtl' | 'ltr';
  className?: string;
  transform?: (value: string) => string;
  prefix?: string;
  hint?: string;
}

export const TextField = ({
  name,
  label,
  placeholder,
  maxLength,
  autoComplete,
  type = 'text',
  dir,
  className,
  transform,
  prefix,
  hint,
}: TextFieldProps) => {
  const generatedId = useId();
  const inputId = `${name}-${generatedId}`;
  const errorId = `${inputId}-error`;
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext<RegistrationData>();
  const error = errors[name]?.message as string | undefined;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, onFieldChange: (value: string) => void) => {
    const nextValue = transform ? transform(event.target.value) : event.target.value;
    onFieldChange(nextValue);
    saveRegistrationDraft(getValues());
  };

  return (
    <div className="space-y-3">
      <Label htmlFor={inputId} className="text-stone-900 text-base font-bold px-1 flex items-center gap-2">
        <span>
          {label}
          <span className="text-rose-600" aria-label="الزامی">*</span>
        </span>
        {hint ? <span className="text-[11px] text-rose-600 font-medium">{hint}</span> : null}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const input = (
            <Input
              {...field}
              id={inputId}
              value={field.value ?? ''}
              onChange={(event) => handleChange(event, field.onChange)}
              maxLength={maxLength}
              autoComplete={autoComplete}
              type={type}
              dir={dir}
              placeholder={placeholder}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              required
              className={cn('h-14 font-medium', className, error && 'border-rose-500 bg-rose-50/10 focus:ring-rose-200')}
            />
          );

          if (!prefix) return input;

          return (
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-lg select-none pointer-events-none group-focus-within:text-rose-600 transition-colors">
                {prefix}
              </div>
              {input}
            </div>
          );
        }}
      />
      <ErrorMessage id={errorId} message={error} />
    </div>
  );
};
