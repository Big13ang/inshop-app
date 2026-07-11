import React from 'react';
import { Phone } from 'lucide-react';
import { cn, convertPersianArabicToEnglish } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import ErrorMessage from './ErrorMessage';

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    isError?: boolean;
    ref?: React.Ref<HTMLInputElement>;
}

export default function PhoneInput({
    label,
    error,
    isError = false,
    className,
    ref,
    ...props
}: PhoneInputProps) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={props.id} className="text-xs font-semibold text-zinc-600 text-right pr-1">
                {label}
            </label>

            <div className="relative flex items-center">
                <Input
                    ref={ref}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    normalize={convertPersianArabicToEnglish}
                    isError={isError}
                    aria-invalid={isError ? 'true' : 'false'}
                    className={cn(
                        'peer text-center text-base tracking-widest pr-11 pl-4',
                        className
                    )}
                    {...props}
                />
                <span
                    className={cn(
                        'absolute right-4 pointer-events-none transition-colors duration-300',
                        isError
                            ? 'text-red-400 peer-focus:text-red-500'
                            : 'text-zinc-400 peer-focus:text-zinc-950'
                    )}
                >
                    <Phone className="w-4 h-4 stroke-2" />
                </span>
            </div>

            {isError && error && <ErrorMessage message={error} />}
        </div>
    );
}
