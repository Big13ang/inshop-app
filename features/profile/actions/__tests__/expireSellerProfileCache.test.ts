import { updateTag } from 'next/cache';
import { sellerProfileCacheTag } from '@/features/profile/services/sellerProfileCacheTag';
import { expireSellerProfileCache } from '../expireSellerProfileCache';

jest.mock('next/cache', () => ({ updateTag: jest.fn() }));

const mockUpdateTag = updateTag as jest.Mock;

describe('expireSellerProfileCache', () => {
  beforeEach(() => {
    mockUpdateTag.mockClear();
  });

  it('expires the same tag the seller profile is cached under, whatever the username case', async () => {
    await expireSellerProfileCache('Shop_A');

    expect(mockUpdateTag).toHaveBeenCalledWith(sellerProfileCacheTag('shop_a'));
  });

  it('does nothing for a username that is not valid', async () => {
    await expireSellerProfileCache('bad name!');

    expect(mockUpdateTag).not.toHaveBeenCalled();
  });
});
