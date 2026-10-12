'use client';

import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UserMe } from '../../services/profileService';
import { profileSchema, type profileSchemaType } from '../editProfileSchema';
import AvatarField from './AvatarField';
import ShopSection from './ShopSection';
import BioSection from './BioSection';
import AddressSection from './AddressSection';
import ContactSection from './ContactSection';

export interface ShopProfileFormProps {
  user: UserMe | null;
  formId?: string;
  onSubmit: (data: profileSchemaType) => void;
  formMethods?: UseFormReturn<profileSchemaType>;
}

export const generateDefaultShopValues = (user: UserMe | null): profileSchemaType => {
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

export function ShopProfileForm({
  user,
  formId = 'edit-profile-form',
  onSubmit,
  formMethods,
}: ShopProfileFormProps) {
  const internalMethods = useForm<profileSchemaType>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    values: generateDefaultShopValues(user),
    resetOptions: { keepDirtyValues: false, keepFieldsRef: true },
  });

  const methods = formMethods ?? internalMethods;
  const handleSubmit = methods.handleSubmit(onSubmit);

  return (
    <FormProvider {...methods}>
      <form id={formId} noValidate onSubmit={handleSubmit} className="space-y-6">
        <AvatarField />
        <ShopSection />
        <BioSection />
        <AddressSection />
        <ContactSection />
      </form>
    </FormProvider>
  );
}
