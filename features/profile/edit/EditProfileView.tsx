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

const FORM_ID = 'edit-profile-form';

export default function EditProfileView() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background" dir="rtl">
      <Header.Root>
        <Header.Back id="edit-profile-back-btn" onClick={handleBack} />
        <Header.Title>{text.edit.headerTitle}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto bg-background px-4 pt-4 pb-6">
        <form id={FORM_ID} onSubmit={(e) => e.preventDefault()} noValidate className="mx-auto max-w-lg space-y-6">
          <AvatarField />
          <ShopSection />
          <BioSection />
          <AddressSection />
          <ContactSection />
        </form>
      </main>

      <EditProfileFooter onCancel={handleBack} />
    </div>
  );
}
