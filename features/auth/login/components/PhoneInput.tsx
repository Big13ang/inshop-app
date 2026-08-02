import React from 'react';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import ErrorMessage from './ErrorMessage';
import { useFormContext, useFormState } from 'react-hook-form';

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    name?: string;
    label?: string;
    error?: string;
    isError?: boolean;
    ref?: React.Ref<HTMLInputElement>;
}

interface PhoneInputUIProps extends PhoneInputProps {
    activeError?: string;
    activeIsError: boolean;
    registerProps: Record<string, unknown>;
}

function PhoneInputUI({
    label = 'شماره همراه',
    activeError,
    activeIsError,
    className,
    id = 'sign-in-phone',
    registerProps,
    error: _error,
    isError: _isError,
    ...props
}: PhoneInputUIProps) {
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
                    isError={activeIsError}
                    aria-invalid={activeIsError ? 'true' : 'false'}
                    className={cn(
                        'peer text-center text-base tracking-widest pr-11 pl-4',
                        className
                    )}
                    {...props}
                    {...registerProps}
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

function ContextPhoneInput(props: PhoneInputProps & { name: string }) {
    const formContext = useFormContext();
    const { errors } = useFormState({ control: formContext.control });

    const registerProps = formContext.register(props.name);
    const formError = errors?.[props.name]?.message as string | undefined;

    const activeError = props.error || formError;
    const activeIsError = props.isError ?? !!activeError;

    return (
        <PhoneInputUI
            {...props}
            activeError={activeError}
            activeIsError={activeIsError}
            registerProps={registerProps}
        />
    );
}

function StandalonePhoneInput(props: PhoneInputProps) {
    const activeError = props.error;
    const activeIsError = props.isError ?? !!activeError;

    return (
        <PhoneInputUI
            {...props}
            activeError={activeError}
            activeIsError={activeIsError}
            registerProps={{}}
        />
    );
}

export default function PhoneInput({
    name = 'phoneNumber',
    ...props
}: PhoneInputProps) {
    const formContext = useFormContext();

    if (formContext) {
        return <ContextPhoneInput name={name} {...props} />;
    }

    return <StandalonePhoneInput name={name} {...props} />;
}
