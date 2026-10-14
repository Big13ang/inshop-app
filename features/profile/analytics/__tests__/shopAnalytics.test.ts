import { analytics } from '@/lib/analytics/analytics';
import { shopAnalytics } from '../shopAnalytics';

const shop = { username: 'kafsh', shopName: 'کفش‌سرا' };

describe('shopAnalytics', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('tracks view_shop', () => {
    const track = jest.spyOn(analytics, 'track').mockImplementation(() => {});

    shopAnalytics.viewShop(shop, false);

    expect(track).toHaveBeenCalledWith('view_shop', {
      shop_username: 'kafsh',
      shop_name: 'کفش‌سرا',
      is_owner: false,
    });
  });

  it('tracks contact_seller with the contact method', () => {
    const track = jest.spyOn(analytics, 'track').mockImplementation(() => {});

    shopAnalytics.contactSeller(shop, 'copy_phone');

    expect(track).toHaveBeenCalledWith('contact_seller', {
      shop_username: 'kafsh',
      shop_name: 'کفش‌سرا',
      method: 'copy_phone',
    });
  });
});
