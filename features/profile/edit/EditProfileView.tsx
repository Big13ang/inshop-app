'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import type { accountSchemaType } from './account/accountSchema';

const FORM_ID = 'edit-profile-form';
const ACCOUNT_FORM_ID = 'edit-account-form';

const generateDefaultValues = (user: UserMe | null): profileSchemaType => {
  if (!user?.sellerProfile) {
    return {
      address: "",
      addressShow: false,
      bio: "",
      shopName: "",
      shopPhoneNumber: "",
      username: "",
    };
  }

  const seller = user.sellerProfile;
  return {
    address: seller.address ?? "",
    addressShow: seller.addressShow ?? false,
    bio: seller.bio ?? "",
    shopName: seller.shopName ?? "",
    shopPhoneNumber: seller.phones?.[0]?.phoneNumber ?? "",
    username: seller.username ?? "",
  };
};

export function EditProfileView() {
  const { user, isVerifying } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileEditTab>('account');

  useEffect(() => {
    if (isVerifying || !user) return;
    if (!user.isVerifiedSeller && activeTab === 'shop') {
      router.replace(PROFILE_ROUTES.unverified);
    }
  }, [user, isVerifying, router, activeTab]);

  const createProfileMutation = useCreateProfile(() => {
    router.push('/app/profile');
  });

  const updateAccountMutation = useUpdateUserAccount(() => {
    router.push('/app/profile');
  });

  const methods = useForm<profileSchemaType>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    values: generateDefaultValues(user),
  });

  const handleBack = () => {
    router.push('/app/profile');
  };

  const handleSubmit = methods.handleSubmit((data: profileSchemaType) => {
    createProfileMutation.mutate(data);
  });

  const handleAccountSubmit = (data: accountSchemaType) => {
    updateAccountMutation.mutate(data);
  };

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
          {/* Tab Switcher: Store Profile vs User Account */}
          <ProfileEditTabSwitcher
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Tab 1: Original Store Profile Form */}
          {activeTab === 'shop' ? (
            <FormProvider {...methods}>
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
            />
          )}
        </div>
      </main>

      <EditProfileFooter
        formId={currentFormId}
        isSaving={isSaving}
        onCancel={handleBack}
      />
    </div>
  );
}
