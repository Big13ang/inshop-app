'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import { text, PROFILE_ROUTES } from '../constants';
import { EditProfileFooter } from './components/EditProfileFooter';
import { useUpdateUserAccount, profileService } from '../services/profileService';
import { useCreateProfile } from '../services/profileMutationService';
import { ProfileEditTabSwitcher, type ProfileEditTab } from './components/ProfileEditTabSwitcher';
import { FirstTimeSellerAlert } from './components/FirstTimeSellerAlert';
import { ShopProfileForm } from './components/ShopProfileForm';
import { UserAccountForm } from './account/UserAccountForm';
import { ProfileEditSkeleton } from '../components/ProfileSkeleton';
import { UnverifiedSellerView } from '../unverified/UnverifiedSellerView';
import { PROFILE_FORM_STATE, resolveProfileStateKey } from './profileFormState';
import type { profileSchemaType } from './editProfileSchema';
import type { accountSchemaType } from './account/accountSchema';

const SHOP_FORM_ID = 'edit-profile-form';
const ACCOUNT_FORM_ID = 'edit-account-form';

export function EditProfileView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: user, isPending } = profileService.useMe({
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const stateKey = resolveProfileStateKey(user ?? null);
  const stateConfig = PROFILE_FORM_STATE[stateKey];

  const activeTab: ProfileEditTab =
    searchParams.get('tab') === 'shopProfile' ? 'shopProfile' : 'userProfile';

  const createProfileMutation = useCreateProfile();
  const updateAccountMutation = useUpdateUserAccount();

  const handleTabChange = (nextTab: ProfileEditTab) => {
    router.replace(`?tab=${nextTab}`, { scroll: false });
  };

  const handleBack = () => {
    if (stateConfig.requiresShopCompletion) {
      toast.warning('امکان خروج وجود ندارد؛ لطفاً ابتدا پروفایل فروشگاه خود را تکمیل کنید.');
      return;
    }
    router.push(PROFILE_ROUTES.overview);
  };

  const handleCancel = () => {
    if (stateConfig.requiresShopCompletion) {
      toast.warning('امکان خروج وجود ندارد؛ لطفاً ابتدا پروفایل فروشگاه خود را تکمیل کنید.');
      return;
    }
    router.push(PROFILE_ROUTES.overview);
  };

  const handleShopSubmit = (data: profileSchemaType) => {
    createProfileMutation.mutate(data);
  };

  const handleAccountSubmit = (data: accountSchemaType) => {
    updateAccountMutation.mutate(data);
  };

  const FORM_STATES: Record<
    ProfileEditTab,
    {
      component: React.ReactNode;
      showFooter: boolean;
      formId: string;
      isSaving: boolean;
    }
  > = {
    userProfile: {
      component: (
        <UserAccountForm
          user={user ?? null}
          formId={ACCOUNT_FORM_ID}
          onSubmit={handleAccountSubmit}
        />
      ),
      showFooter: true,
      formId: ACCOUNT_FORM_ID,
      isSaving: updateAccountMutation.isPending,
    },
    shopProfile: {
      component: !stateConfig.canAccessShopForm ? (
        <UnverifiedSellerView isEmbedded={true} />
      ) : (
        <ShopProfileForm
          user={user ?? null}
          formId={SHOP_FORM_ID}
          onSubmit={handleShopSubmit}
        />
      ),
      showFooter: stateConfig.canAccessShopForm,
      formId: SHOP_FORM_ID,
      isSaving: createProfileMutation.isPending,
    },
  };

  const currentTabState = FORM_STATES[activeTab];

  if (isPending && !user) {
    return <ProfileEditSkeleton />;
  }

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <Header.Root>
        <Header.Back id="edit-profile-back-btn" onClick={handleBack} />
        <Header.Title>{text.edit.headerTitle}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background px-4 pt-4 pb-6">
        <div className="mx-auto max-w-lg space-y-6">
          {stateConfig.requiresShopCompletion && <FirstTimeSellerAlert />}

          <ProfileEditTabSwitcher
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <div key={activeTab}>
            {currentTabState.component}
          </div>
        </div>
      </main>

      {currentTabState.showFooter && (
        <EditProfileFooter
          formId={currentTabState.formId}
          isSaving={currentTabState.isSaving}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
