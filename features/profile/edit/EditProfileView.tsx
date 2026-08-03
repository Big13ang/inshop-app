'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { text } from '../constants';
import AvatarField from './components/AvatarField';
import ShopSection from './components/ShopSection';
import BioSection from './components/BioSection';
import AddressSection from './components/AddressSection';
import ContactSection from './components/ContactSection';
import EditProfileFooter from './components/EditProfileFooter';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, profileSchemaType } from './editProfileSchema';
import { useUser } from '../context/UserContext';
import { UserMe } from '../services/profileService';
import { ProfileEditSkeleton } from '../components/ProfileSkeleton';

const FORM_ID = 'edit-profile-form';


const generateDefaultValues = (user: UserMe | null): profileSchemaType => {
  if (!user || !user.sellerProfile) {
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


export default function EditProfileView() {
  const { user, isLoading } = useUser();

  const router = useRouter();
  const methods = useForm({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    values: generateDefaultValues(user),
  });

  const handleBack = () => {
    router.push('/app/profile');
  };

  if (isLoading) {
    return <ProfileEditSkeleton />;
  }

  return (
    <FormProvider {...methods}>
      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
        <Header.Root>
          <Header.Back id="edit-profile-back-btn" onClick={handleBack} />
          <Header.Title>{text.edit.headerTitle}</Header.Title>
          <Header.Right />
        </Header.Root>

        <main className="hide-scrollbar flex-1 overflow-y-auto bg-background px-4 pt-4 pb-6">
          <form id={FORM_ID} noValidate className="mx-auto max-w-lg space-y-6">
            <AvatarField />
            <ShopSection />
            <BioSection />
            <AddressSection />
            <ContactSection />
          </form>
        </main>

        <EditProfileFooter onCancel={handleBack} />
      </div>
    </FormProvider >
  );
}
