import React from 'react';
import { Phone } from 'lucide-react';
import { cn, convertPersianArabicToEnglish } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import ErrorMessage from './ErrorMessage';
import { useFormContext } from 'react-hook-form';

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    name?: string;
    label?: string;
    error?: string;
    isError?: boolean;
    ref?: React.Ref<HTMLInputElement>;
}

export default function PhoneInput({
    name = 'phoneNumber',
    label = 'شماره همراه',
    error: customError,
    isError: customIsError,
    className,
    id = 'sign-in-phone',
    ...props
}: PhoneInputProps) {
    const formContext = useFormContext();

    const registerProps = formContext ? formContext.register(name) : {};
    const formError = formContext?.formState.errors[name]?.message as string | undefined;

    const activeError = customError || formError;
    const activeIsError = customIsError ?? !!activeError;

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-xs font-semibold text-zinc-600 text-right pr-1">
                {label}
            </label>

            <div className="relative flex items-center" suppressHydrationWarning={true}>
                <Input
                    id={id}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    normalize={convertPersianArabicToEnglish}
                    isError={activeIsError}
                    aria-invalid={activeIsError ? 'true' : 'false'}
                    className={cn(
                        'peer text-center text-base tracking-widest pr-11 pl-4',
                        className
                    )}
                    {...registerProps}
                    {...props}
                />
                <span
                    className={cn(
                        'absolute right-4 pointer-events-none transition-colors duration-300',
                        activeIsError
                            ? 'text-red-400 peer-focus:text-red-500'
                            : 'text-zinc-400 peer-focus:text-zinc-950'
                    )}
                >
                    <Phone className="w-4 h-4 stroke-2" />
                </span>
            </div>

            {activeIsError && activeError && <ErrorMessage message={activeError} />}
        </div>
    );
}

