'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import { text, PROFILE_ROUTES } from '../constants';
import AvatarField from './components/AvatarField';
import ShopSection from './components/ShopSection';
import BioSection from './components/BioSection';
import AddressSection from './components/AddressSection';
import ContactSection from './components/ContactSection';
import { EditProfileFooter } from './components/EditProfileFooter';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, profileSchemaType } from './editProfileSchema';
import { useUser } from '../context/UserContext';
import { UserMe, useUpdateUserAccount } from '../services/profileService';
import { useCreateProfile } from '../services/profileMutationService';
import { ProfileEditTabSwitcher, type ProfileEditTab } from './components/ProfileEditTabSwitcher';
import { UserAccountForm } from './account/UserAccountForm';
import {
  accountSchema,
  generateDefaultAccountValues,
  type accountSchemaInput,
  type accountSchemaType,
} from './account/accountSchema';
import { ProfileEditSkeleton } from '../components/ProfileSkeleton';

const FORM_ID = 'edit-profile-form';
const ACCOUNT_FORM_ID = 'edit-account-form';

const generateDefaultValues = (user: UserMe | null): profileSchemaType => {
  if (!user?.sellerProfile) {
    return {
      address: '',
      addressShow: false,
      bio: user?.businessData?.bio ?? user?.description ?? '',
      shopName: '',
      shopPhoneNumber: user?.profile?.phoneNumber ?? '',
      username: user?.businessData?.instagramId ?? '',
    };
  }

  const seller = user.sellerProfile;
  return {
    address: seller.address ?? '',
    addressShow: seller.addressShow ?? false,
    bio: seller.bio ?? user?.businessData?.bio ?? user?.description ?? '',
    shopName: seller.shopName ?? '',
    shopPhoneNumber: seller.phones?.[0]?.phoneNumber ?? user?.profile?.phoneNumber ?? '',
    username: seller.username ?? user?.businessData?.instagramId ?? '',
  };
};

export function EditProfileView() {
  const { user, isVerifying } = useUser();
  const router = useRouter();

  const isFirstTimeSeller = Boolean(user?.isVerifiedSeller && !user?.sellerProfile);

  const [activeTab, setActiveTab] = useState<ProfileEditTab>(() => {
    if (user?.isVerifiedSeller && !user?.sellerProfile) {
      return 'shop';
    }
    return 'account';
  });

  useEffect(() => {
    if (user?.isVerifiedSeller && !user?.sellerProfile && activeTab !== 'shop') {
      setActiveTab('shop');
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (isVerifying || !user) return;
    if (!user.isVerifiedSeller && activeTab === 'shop') {
      router.replace(PROFILE_ROUTES.unverified);
    }
  }, [user, isVerifying, router, activeTab]);

  const createProfileMutation = useCreateProfile(() => {
    router.push(PROFILE_ROUTES.overview);
  });

  const updateAccountMutation = useUpdateUserAccount(() => {
    router.push(PROFILE_ROUTES.overview);
  });

  const shopMethods = useForm<profileSchemaType>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    values: generateDefaultValues(user),
    resetOptions: { keepDirtyValues: false },
  });

  const accountMethods = useForm<accountSchemaInput, unknown, accountSchemaType>({
    resolver: zodResolver(accountSchema),
    mode: 'onChange',
    values: generateDefaultAccountValues(user),
    resetOptions: { keepDirtyValues: false },
  });

  useEffect(() => {
    return () => {
      shopMethods.reset(generateDefaultValues(user));
      accountMethods.reset(generateDefaultAccountValues(user));
    };
  }, [user, shopMethods, accountMethods]);

  const handleBack = () => {
    if (isFirstTimeSeller) {
      toast.warning('امکان خروج وجود ندارد؛ لطفاً ابتدا پروفایل فروشگاه خود را تکمیل کنید.');
      return;
    }

    shopMethods.reset(generateDefaultValues(user));
    accountMethods.reset(generateDefaultAccountValues(user));
    router.push(PROFILE_ROUTES.overview);
  };

  const handleCancel = () => {
    if (activeTab === 'shop') {
      shopMethods.reset(generateDefaultValues(user));
    } else {
      accountMethods.reset(generateDefaultAccountValues(user));
    }

    if (isFirstTimeSeller) {
      toast.warning('امکان خروج وجود ندارد؛ لطفاً ابتدا پروفایل فروشگاه خود را تکمیل کنید.');
      return;
    }

    router.push(PROFILE_ROUTES.overview);
  };

  const handleSubmit = shopMethods.handleSubmit((data: profileSchemaType) => {
    createProfileMutation.mutate(data);
  });

  const handleAccountSubmit = (data: accountSchemaType) => {
    updateAccountMutation.mutate(data);
  };

  if (isVerifying && !user) {
    return <ProfileEditSkeleton />;
  }

  const isSaving = activeTab === 'shop'
    ? createProfileMutation.isPending
    : updateAccountMutation.isPending;

  const currentFormId = activeTab === 'shop' ? FORM_ID : ACCOUNT_FORM_ID;

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <Header.Root>
        <Header.Back id="edit-profile-back-btn" onClick={handleBack} />
        <Header.Title>{text.edit.headerTitle}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background px-4 pt-4 pb-6">
        <div className="mx-auto max-w-lg space-y-6">
          {/* First-time Verified Seller Guidance Banner */}
          {isFirstTimeSeller && (
            <div
              id="first-time-seller-alert"
              className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-xs text-foreground shadow-xs"
              role="alert"
            >
              <Store className="size-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-sm text-primary">تکمیل پروفایل فروشگاه</span>
                <p className="text-secondary leading-5">
                  حساب شما به عنوان فروشنده تأیید شده است. لطفاً برای شروع فعالیت و ورود به برنامه، ابتدا اطلاعات فروشگاه خود را تکمیل و ثبت نمایید.
                </p>
              </div>
            </div>
          )}

          {/* Tab Switcher: Store Profile vs User Account */}
          <ProfileEditTabSwitcher
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Tab 1: Original Store Profile Form */}
          {activeTab === 'shop' ? (
            <FormProvider {...shopMethods}>
              <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="space-y-6">
                <AvatarField />
                <ShopSection />
                <BioSection />
                <AddressSection />
                <ContactSection />
              </form>
            </FormProvider>
          ) : (
            /* Tab 2: User Account Information Form */
            <UserAccountForm
              user={user}
              formId={ACCOUNT_FORM_ID}
              onSubmit={handleAccountSubmit}
              formMethods={accountMethods}
            />
          )}
        </div>
      </main>

      <EditProfileFooter
        formId={currentFormId}
        isSaving={isSaving}
        onCancel={handleCancel}
      />
    </div>
  );
}

