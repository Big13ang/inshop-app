import { render, screen } from '@testing-library/react';
import type { SellerProfile } from '../../../services/profileService';
import { ShopProfileSocialInfo } from '../ShopProfileSocialInfo';

function makeProfile(overrides: Partial<SellerProfile> = {}): SellerProfile {
  return { id: '1', userId: 'u1', username: 'shop', shopName: 'Shop', ...overrides };
}

describe('ShopProfileSocialInfo', () => {
  it('renders "-" for follower count and Instagram when they are not set', () => {
    render(<ShopProfileSocialInfo profile={makeProfile()} />);

    expect(screen.getByText('تعداد دنبال‌کننده: -')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it.each([null, '', '0'])('renders "-" for follower count %p', (value) => {
    render(<ShopProfileSocialInfo profile={makeProfile({ instagramFollowersCount: value })} />);

    expect(screen.getByText('تعداد دنبال‌کننده: -')).toBeInTheDocument();
  });

  it('renders follower count in compact form', () => {
    render(<ShopProfileSocialInfo profile={makeProfile({ instagramFollowersCount: '24500' })} />);

    expect(screen.getByText('تعداد دنبال‌کننده: 24.5K')).toBeInTheDocument();
  });

  it('renders Instagram username as plain text without @ and not as a hyperlink', () => {
    render(<ShopProfileSocialInfo profile={makeProfile({ instagramUsername: 'my_awesome_shop' })} />);

    const instagramText = screen.getByText('my_awesome_shop');
    expect(instagramText.closest('a')).toBeNull();
  });

  it('renders address when it is shown', () => {
    render(<ShopProfileSocialInfo profile={makeProfile({ address: 'تهران، خیابان آزادی', addressShow: true })} />);

    expect(screen.getByText('تهران، خیابان آزادی')).toBeInTheDocument();
  });

  it('hides address when addressShow is false', () => {
    render(<ShopProfileSocialInfo profile={makeProfile({ address: 'تهران، خیابان آزادی', addressShow: false })} />);

    expect(screen.queryByText('تهران، خیابان آزادی')).not.toBeInTheDocument();
  });

  it('renders "-" for Instagram data on a public profile', () => {
    render(<ShopProfileSocialInfo profile={{ username: 'shop', shopName: 'Shop' }} />);

    expect(screen.getByText('تعداد دنبال‌کننده: -')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders address from a public profile (no addressShow field)', () => {
    render(
      <ShopProfileSocialInfo
        profile={{ username: 'shop', shopName: 'Shop', address: 'تهران، سعادت‌آباد' }}
      />
    );

    expect(screen.getByText('تهران، سعادت‌آباد')).toBeInTheDocument();
  });

  it('renders Instagram, then follower count, above address', () => {
    const { container } = render(
      <ShopProfileSocialInfo
        profile={makeProfile({
          instagramFollowersCount: '1500',
          instagramUsername: 'order_test_shop',
          address: 'تهران، سعادت‌آباد',
        })}
      />
    );

    const items = container.querySelectorAll('.space-y-2\\.5 > div');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('order_test_shop');
    expect(items[1]).toHaveTextContent('تعداد دنبال‌کننده: 1.5K');
    expect(items[2]).toHaveTextContent('تهران، سعادت‌آباد');
  });
});
