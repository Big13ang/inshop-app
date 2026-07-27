'use client';

import { FormProvider, useWatch } from 'react-hook-form';
import Header from '@/components/layout/Header';
import { ProfileEditSkeleton } from '../components/ProfileSkeleton';
import type { UserProfile } from '../services/profileService';
import AvatarField from './components/AvatarField';
import ShopSection from './components/ShopSection';
import BioSection from './components/BioSection';
import AddressSection from './components/AddressSection';
import ContactSection from './components/ContactSection';
import EditProfileFooter from './components/EditProfileFooter';
import { useEditProfileForm } from './hooks/useEditProfileForm';

const FORM_ID = 'edit-profile-form';

interface EditProfileViewProps {
  user?: UserProfile;
}

export default function EditProfileView({ user: initialUser }: EditProfileViewProps = {}) {
  const {
    user,
    isLoading,
    form,
    isSaving,
    shopNameForAvatar,
    headerTitle,
    submitText,
    handleAvatarChange,
    handleCancel,
    handleSubmit,
  } = useEditProfileForm({ initialUser });

  if (isLoading || !user) {
    return <ProfileEditSkeleton />;
  }

  return (
    <ViewContent
      form={form}
      isSaving={isSaving}
      shopNameForAvatar={shopNameForAvatar}
      headerTitle={headerTitle}
      submitText={submitText}
      onAvatarChange={handleAvatarChange}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
    />
  );
}

interface ViewContentProps {
  form: ReturnType<typeof useEditProfileForm>['form'];
  isSaving: boolean;
  shopNameForAvatar: string;
  headerTitle: string;
  submitText: string;
  onAvatarChange: (dataUrl: string) => void;
  onCancel: () => void;
  onSubmit: ReturnType<typeof useEditProfileForm>['handleSubmit'];
}

function ViewContent({
  form,
  isSaving,
  shopNameForAvatar,
  headerTitle,
  submitText,
  onAvatarChange,
  onCancel,
  onSubmit,
}: ViewContentProps) {
  const avatarValue = useWatch({ control: form.control, name: 'profilePhotoUrl' });

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <Header.Root>
        <Header.Back id="edit-profile-back-btn" onClick={onCancel} />
        <Header.Title>{headerTitle}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background px-4 pt-4 pb-6">
        <FormProvider {...form}>
          <form id={FORM_ID} onSubmit={onSubmit} noValidate className="mx-auto max-w-lg space-y-6">
            <AvatarField
              value={avatarValue}
              alt={shopNameForAvatar}
              onChange={onAvatarChange}
            />
            <ShopSection />
            <BioSection />
            <AddressSection />
            <ContactSection />
          </form>
        </FormProvider>
      </main>

      <EditProfileFooter
        formId={FORM_ID}
        isSaving={isSaving}
        submitText={submitText}
        onCancel={onCancel}
      />
    </div>
  );
}
