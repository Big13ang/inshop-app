'use client';

import { useSyncExternalStore } from 'react';
import { RegistrationForm } from '@/features/campaign/organisms/RegistrationForm';
import { CAMPAIGN_ROUTES } from '@/features/campaign/constants/links';

const navigateToLanding = () => {
  window.location.assign(CAMPAIGN_ROUTES.landing);
};

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function CampaignPreRegister() {
  // The form restores its draft from localStorage on its first render, so it only renders in the browser.
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  return (
    <div className="min-h-screen selection:bg-rose-100 bg-white" dir="rtl">
      {isClient ? <RegistrationForm onClose={navigateToLanding} /> : <div className="fixed inset-0 bg-stone-50" />}
    </div>
  );
}
