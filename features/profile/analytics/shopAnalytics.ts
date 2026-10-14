import { analytics } from '@/lib/analytics/analytics';

export type ContactSellerMethod = 'phone_call' | 'copy_phone';

export interface AnalyticsShop {
  username: string;
  shopName?: string;
}

function toShopParams(shop: AnalyticsShop) {
  return {
    shop_username: shop.username,
    shop_name: shop.shopName,
  };
}

export const shopAnalytics = {
  viewShop(shop: AnalyticsShop, isOwner: boolean) {
    analytics.track('view_shop', { ...toShopParams(shop), is_owner: isOwner });
  },

  contactSeller(shop: AnalyticsShop, method: ContactSellerMethod) {
    analytics.track('contact_seller', { ...toShopParams(shop), method });
  },
};
