'use client';

import React, { useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'motion/react';
import { Drawer } from 'vaul';
import { toast } from 'sonner';
import { ArrowLeft, Check, Loader2, X } from 'lucide-react';

import { Button } from '@/features/campaign/ui/button';
import { Dialog, DialogContent } from '@/features/campaign/ui/dialog';
import { cn, Result } from '@/lib/utils';
import { InShopLogo } from '../atoms/InShopLogo';
import { RegisteredStateCard } from './registration-form/RegisteredStateCard';
import {
  CategoryField,
  CityField,
  DescriptionField,
  FirstNameField,
  FollowersField,
  LastNameField,
  NationalIdField,
  PhoneNumberField,
  ProvinceField,
  StoreIdField,
} from './registration-form/fields/RegistrationFields';
import {
  defaultRegistrationValues,
  RegistrationData,
  registrationSchema,
  sanitizeText,
} from './registration-form/schema';
import { useMediaQuery } from './registration-form/useMediaQuery';
import {
  clearRegistrationSubmitted,
  markRegistrationSubmitted,
  readInitialRegistrationState,
} from './registration-form/draftStorage';
import { getPreRegistrationErrorMessage, submitPreRegistration } from '@/features/campaign/services/preRegistration';
import { BALE_PRIVATE_CHANNEL_URL } from '@/features/campaign/constants/links';

interface RegistrationFormProps {
  onClose?: () => void;
}

const StepCard = ({
  cardKey,
  children,
}: {
  cardKey: string;
  children: React.ReactNode;
}) => (
  <motion.div
    key={cardKey}
    initial={{ opacity: 0, scale: 0.98, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.98, y: -10 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 border border-stone-200 shadow-2xl shadow-stone-200/50 space-y-10"
  >
    {children}
  </motion.div>
);

const StepHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="space-y-2">
    <h2 className="text-3xl md:text-4xl font-display font-bold text-stone-900 tracking-tight">{title}</h2>
    <p className="text-stone-500 text-base md:text-lg">{subtitle}</p>
  </div>
);

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onClose }) => {
  // Rendered client-only (see CampaignPreRegister), so storage can be read on the first render.
  const [initialState] = useState(readInitialRegistrationState);
  const [step, setStep] = useState(1);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(initialState.isRegistered);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const methods = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
    defaultValues: initialState.values,
  });

  const {
    handleSubmit,
    reset,
    trigger,
    formState: { isSubmitting },
  } = methods;

  const scrollFormToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleNext = async () => {
    setSubmitError(null);
    const isValid = await trigger([
      'firstName',
      'lastName',
      'mobile',
      'nationalId',
      'province',
      'city',
    ]);

    if (!isValid) return;
    setStep(2);
    scrollFormToTop();
  };

  const handlePreviousStep = () => {
    setStep(1);
    scrollFormToTop();
  };

  const onSubmit = async (data: RegistrationData) => {
    setSubmitError(null);

    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        typeof value === 'string' ? sanitizeText(value) : value,
      ])
    ) as RegistrationData;

    const validationResult = registrationSchema.safeParse(sanitizedData);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'اطلاعات فرم نامعتبر است.';
      setSubmitError(firstError);
      toast.error(firstError);
      return;
    }

    const result = await Result.try(submitPreRegistration({
        name: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        phoneNumber: sanitizedData.mobile,
        nationalIdNumber: sanitizedData.nationalId,
        province: sanitizedData.province,
        city: sanitizedData.city,
        instagramId: sanitizedData.storeId,
        followersCount: sanitizedData.followers,
        productCategory: sanitizedData.category,
        bio: sanitizedData.description,
        businessType: "نامشخص"
      }));

    if (!result.ok) {
      const message = getPreRegistrationErrorMessage(result.error);
      setSubmitError(message);
      toast.error(message);
      return;
    }

    // The backend's `message` is an untranslated i18n key, so the Persian copy is shown instead.
    const successMessage = 'پیش‌ثبت‌نام شما با موفقیت ارسال شد.';

    markRegistrationSubmitted();
    setSubmitSuccessMessage(successMessage);
    setIsRegistered(true);
    setIsSuccessOpen(true);
    scrollFormToTop();
    toast.success(successMessage);
  };

  const handleSuccessOpenChange = (open: boolean) => {
    setIsSuccessOpen(open);
    scrollFormToTop();
    if (!open) onClose?.();
  };

  const handleRegisterAnotherStore = () => {
    clearRegistrationSubmitted();
    setIsRegistered(false);
    setStep(1);
    setSubmitError(null);
    reset(defaultRegistrationValues);
    scrollFormToTop();
  };

  const openBaleChannel = () => {
    window.open(BALE_PRIVATE_CHANNEL_URL, '_blank', 'noopener,noreferrer');
  };

  const renderSuccessContent = () => (
    <div className="relative">
      <div className="h-24 bg-stone-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-rose-50 to-transparent" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
          className="w-14 h-14 bg-rose-600 rounded-full flex items-center justify-center text-white relative z-10 shadow-lg shadow-rose-200"
        >
          <Check size={28} strokeWidth={3} />
        </motion.div>
      </div>

      <div className="p-8 md:p-10 space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-stone-900 tracking-tight">
            پیش‌ثبت‌نام با موفقیت انجام شد
          </h2>
          <p className="text-stone-500 text-sm md:text-base leading-relaxed font-medium">
            {submitSuccessMessage || 'اطلاعات شما در سیستم ثبت شد. برای تایید نهایی و دریافت پنل مدیریت، همین حالا عضو کانال ما در پیام‌رسان بله شوید.'}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="cta"
            className="w-full h-14 rounded-2xl gap-3 text-base font-bold transition-all"
            onClick={openBaleChannel}
          >
            عضویت در کانال پیگیری (بله)
          </Button>

          <div className="flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-stone-100" />
            <span className="text-[10px] md:text-[11px] text-rose-500/80 font-bold uppercase tracking-wider whitespace-nowrap">
              تایید نهایی مستلزم عضویت در کانال است
            </span>
            <div className="h-px flex-1 bg-stone-100" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-stone-50 flex flex-col overflow-hidden">
      {isMobile ? (
        <Drawer.Root
          open={isSuccessOpen}
          onOpenChange={handleSuccessOpenChange}
          shouldScaleBackground
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[200]" />
            <Drawer.Content className="bg-white flex flex-col rounded-t-[1.5rem] mt-24 fixed bottom-0 left-0 right-0 z-[201] outline-none" dir="rtl">
              <div className="bg-white rounded-t-[1.5rem] overflow-hidden">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-stone-200 mt-4 mb-2" />
                {renderSuccessContent()}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <Dialog
          open={isSuccessOpen}
          onOpenChange={handleSuccessOpenChange}
        >
          <DialogContent
            className="sm:max-w-md bg-white rounded-[1.5rem] p-0 border-none outline-none shadow-2xl overflow-hidden z-[201]"
            dir="rtl"
          >
            {renderSuccessContent()}
          </DialogContent>
        </Dialog>
      )}

      <div className="bg-white/80 backdrop-blur-xl border-b border-stone-200 sticky top-0 z-[110] px-6 py-4 md:py-6 overflow-hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              size="icon"
              onClick={onClose}
              className="size-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-500 hover:text-stone-900 border border-stone-100 transition-all active:scale-95 [&_svg:not([class*='size-'])]:size-5"
              aria-label="بستن"
            >
              <X size={20} />
            </Button>
            <InShopLogo />
          </div>

          <div className="flex flex-1 items-center justify-end md:justify-center gap-2 max-w-lg">
            <StepperItem active={step === 1 && !isRegistered} complete={step > 1 || isRegistered} label="اطلاعات فردی" number={1} />
            <div className="flex-1 min-w-[30px] h-px relative mx-1">
              <div
                className={cn(
                  'absolute inset-0 transition-all duration-700',
                  step > 1 || isRegistered ? 'bg-rose-600 h-px' : 'border-t-2 border-dashed border-rose-200'
                )}
              />
            </div>
            <StepperItem active={step === 2 && !isRegistered} complete={step > 2 || isRegistered} label="اطلاعات کسب‌وکار" number={2} />
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto px-6 py-12 md:py-16" noValidate>
            {isRegistered && !isSuccessOpen ? (
              <RegisteredStateCard
                onClose={onClose}
                onRegisterAnotherStore={handleRegisterAnotherStore}
              />
            ) : (
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <StepCard cardKey="step1">
                    <StepHeader
                      title="اطلاعات فردی"
                      subtitle="لطفاً پروفایل خود را برای شروع همکاری تکمیل کنید."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                      <FirstNameField />
                      <LastNameField />
                      <PhoneNumberField />
                      <NationalIdField />
                      <ProvinceField />
                      <CityField />
                    </div>

                    <div className="mt-8 rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4 md:p-5 flex items-start gap-3" dir="rtl">
                      <p className="text-[11px] md:text-xs text-stone-500 font-medium leading-relaxed text-justify">
                        <strong className="text-stone-700 ml-1">حریم خصوصی شما امانت ماست.</strong>
                        اطلاعات تماس و کد ملی شما نزد <span className="font-bold text-stone-700">inShop</span> محفوظ است و دیگر کاربران هرگز دسترسی به این اطلاعات نخواهند داشت.
                      </p>
                    </div>

                    <div className="pt-10 flex justify-center">
                      <Button
                        type="button"
                        onClick={handleNext}
                        variant="cta"
                        className="group relative w-full md:w-64 h-16 rounded-2xl text-lg font-bold gap-4 transition-all duration-300"
                      >
                        مرحله بعدی
                        <ArrowLeft size={22} className="transition-transform duration-300 group-hover:-translate-x-1" />
                      </Button>
                    </div>
                  </StepCard>
                ) : (
                  <StepCard cardKey="step2">
                    <StepHeader
                      title="اطلاعات کسب‌وکار"
                      subtitle="پل ارتباطی و جزئیات فعالیت فروشگاه شما"
                    />

                    <div className="space-y-8">
                      <StoreIdField />
                      <FollowersField />
                      <CategoryField />
                      <DescriptionField />
                    </div>

                    <div className="space-y-5 pt-6">
                      {submitError && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold leading-relaxed text-rose-700" role="alert">
                          {submitError}
                        </div>
                      )}

                      <div className="flex flex-col md:flex-row gap-5 md:justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePreviousStep}
                          disabled={isSubmitting}
                          className="h-16 order-2 md:order-1 px-10 rounded-2xl border-stone-200 text-stone-600 text-lg font-bold hover:bg-stone-50 hover:border-stone-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          مرحله قبلی
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          aria-busy={isSubmitting}
                          className="group relative h-16 order-1 md:order-2 flex-grow md:flex-grow-0 md:px-12 bg-linear-to-r from-rose-600 to-rose-500 hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl text-lg font-bold shadow-xl shadow-rose-200 border-none transition-all duration-300"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="animate-spin" />
                              در حال ارسال...
                            </>
                          ) : (
                            'تایید و پیش‌ثبت‌نام نهایی'
                          )}
                        </Button>
                      </div>
                    </div>
                  </StepCard>
                )}
              </AnimatePresence>
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

const StepperItem = ({
  active,
  complete,
  label,
  number,
}: {
  active: boolean;
  complete: boolean;
  label: string;
  number: number;
}) => (
  <div className="flex items-center gap-3">
    <div
      className={cn(
        'w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 border-2',
        active
          ? 'bg-rose-50 border-rose-600 text-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.1)]'
          : complete
            ? 'bg-rose-600 border-rose-600 text-white'
            : 'bg-stone-50 border-stone-200 border-dashed text-stone-400'
      )}
    >
      {complete ? <Check size={20} strokeWidth={3} /> : number}
    </div>
    <span className={cn('text-sm font-bold hidden md:block', active || complete ? 'text-stone-900' : 'text-stone-400')}>
      {label}
    </span>
  </div>
);
