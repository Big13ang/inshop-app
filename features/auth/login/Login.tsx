'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AppLogo from './components/AppLogo';
import PageHeader from './components/PageHeader';
import TermsText from './components/TermsText';
import PhoneInput from './components/PhoneInput';
import SubmitButton from './components/SubmitButton';
import { loginSchema, LoginFormValues, TEXTS } from './constants';
import { convertPersianArabicToEnglish } from '@/lib/utils';

import { useRouter } from 'next/navigation';

export interface LoginProps {
    onSubmit?: (data: LoginFormValues) => void | Promise<void>;
}

export default function Login({ onSubmit }: LoginProps) {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isValid, isSubmitting, dirtyFields },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: 'onChange',
    });

    const isPhoneError = !!(errors.phone && dirtyFields.phone);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cleaned = convertPersianArabicToEnglish(e.target.value);
        setValue('phone', cleaned, { shouldValidate: true, shouldDirty: true });
    };

    const handleFormSubmit = async (data: LoginFormValues) => {
        if (onSubmit) {
            await onSubmit(data);
        } else {
            router.push(`/auth/otp?phone=${encodeURIComponent(data.phone)}`);
        }
    };

    return (
        <main className="flex-1 flex flex-col justify-between h-full px-6 py-8 bg-surface-l2">
            <AppLogo />

            <form
                onSubmit={handleSubmit(handleFormSubmit)}
                className="w-full max-w-sm mx-auto flex flex-col gap-6"
            >
                <PageHeader title={TEXTS.title} subtitle={TEXTS.subtitle} />

                <PhoneInput
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    placeholder={TEXTS.placeholder}
                    label={TEXTS.label}
                    isError={isPhoneError}
                    error={errors.phone?.message}
                    {...register('phone', { onChange: handlePhoneChange })}
                />

                <SubmitButton
                    id="btn-request-otp"
                    disabled={isSubmitting || !isValid}
                    isSubmitting={isSubmitting}
                    submittingText={TEXTS.isSubmitting}
                >
                    {TEXTS.submit}
                </SubmitButton>
            </form>

            <TermsText text={TEXTS.terms} />
        </main>
    );
}
