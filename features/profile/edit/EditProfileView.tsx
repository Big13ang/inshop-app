'use client';

import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import { profileFormSchema, type ProfileFormValues } from '../schemas/profileSchema';
import { profileMutationService } from '../services/profileMutationService';
import type { UserProfile } from '../services/profileService';
import { getShopName, toFormValues, toUpdatePayload } from '../utils/profileMapper';
import { PROFILE_ROUTES, text } from '../constants';
import AvatarField from './components/AvatarField';
import ShopSection from './components/ShopSection';
import BioSection from './components/BioSection';
import AddressSection from './components/AddressSection';
import ContactSection from './components/ContactSection';
import EditProfileFooter from './components/EditProfileFooter';

const FORM_ID = 'edit-profile-form';

interface EditProfileViewProps {
  user: UserProfile;
}

export default function EditProfileView({ user }: EditProfileViewProps) {
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toFormValues(user),
    mode: 'onTouched',
  });

  const navigateToOverview = () => {
    router.replace(PROFILE_ROUTES.overview);
  };

  const updateProfile = profileMutationService.useUpdateProfile(navigateToOverview);

  const handleAvatarChange = (dataUrl: string) => {
    form.setValue('avatar', dataUrl, { shouldDirty: true });
  };

  // Always lands back on the overview rather than history.back(), so a direct
  // visit to /app/profile/edit still exits somewhere meaningful.
  const handleCancel = () => {
    navigateToOverview();
  };

  // Destructured during render on purpose: react-hook-form's formState is a Proxy
  // that only tracks fields read while rendering — reading `form.formState.isDirty`
  // inside the submit handler alone would never subscribe and always report false.
  const { isDirty } = form.formState;

  const handleSubmit = form.handleSubmit((values) => {
    if (!isDirty) {
      toast.info(text.edit.noChanges);
      navigateToOverview();
      return;
    }
    updateProfile.mutate(toUpdatePayload(values));
  });

  // useWatch (not form.watch) — form.watch returns a function the React Compiler
  // cannot memoize, which makes it bail out of optimizing this whole component.
  const avatarValue = useWatch({ control: form.control, name: 'avatar' });

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <Header.Root>
        <Header.Back id="edit-profile-back-btn" onClick={handleCancel} />
        <Header.Title>{text.edit.headerTitle}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background px-4 pt-4 pb-6">
        <FormProvider {...form}>
          <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="mx-auto max-w-lg space-y-6">
            <AvatarField
              value={avatarValue}
              alt={getShopName(user)}
              onChange={handleAvatarChange}
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
        isSaving={updateProfile.isPending}
        onCancel={handleCancel}
      />
    </div>
  );
}
