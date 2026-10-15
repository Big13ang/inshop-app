import type { Metadata } from 'next';
import { CampaignPreRegister } from '@/features/campaign/CampaignPreRegister';

export const metadata: Metadata = {
  title: 'پیش‌ثبت‌نام فروشگاه | inShop',
};

export default function SellerApplyPage() {
  return <CampaignPreRegister />;
}
