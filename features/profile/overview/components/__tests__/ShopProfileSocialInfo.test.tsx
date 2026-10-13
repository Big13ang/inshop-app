import { render, screen } from '@testing-library/react';
import {
  ShopProfileSocialInfo,
  type ShopSocialProfile,
} from '../ShopProfileSocialInfo';

describe('ShopProfileSocialInfo', () => {
  it('renders nothing when followerCount, instagram, and address are not provided', () => {
    const { container } = render(
      <ShopProfileSocialInfo shopProfile={{}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders follower count in compact form when given a number', () => {
    const profile: ShopSocialProfile = {
      followerCount: 12500,
    };
    render(<ShopProfileSocialInfo shopProfile={profile} />);

    expect(screen.getByText(/تعداد دنبال‌کننده:/)).toBeInTheDocument();
    expect(screen.getByText(/12.5K/)).toBeInTheDocument();
  });

  it('renders follower count in compact form when given a numeric string', () => {
    const profile: ShopSocialProfile = {
      followerCount: '24500',
    };
    render(<ShopProfileSocialInfo shopProfile={profile} />);

    expect(screen.getByText(/تعداد دنبال‌کننده:/)).toBeInTheDocument();
    expect(screen.getByText(/24.5K/)).toBeInTheDocument();
  });

  it('renders Instagram ID as plain text with @ prefix and not as a hyperlink', () => {
    const profile: ShopSocialProfile = {
      instagram: 'my_awesome_shop',
    };
    render(<ShopProfileSocialInfo shopProfile={profile} />);

    const instagramText = screen.getByText('@my_awesome_shop');
    expect(instagramText).toBeInTheDocument();
    expect(instagramText.closest('a')).toBeNull();
  });

  it('strips extra leading @ when rendering Instagram ID', () => {
    const profile: ShopSocialProfile = {
      instagram: '@my_awesome_shop',
    };
    render(<ShopProfileSocialInfo shopProfile={profile} />);

    expect(screen.getByText('@my_awesome_shop')).toBeInTheDocument();
  });

  it('renders handleId as Instagram ID fallback when instagram is not provided', () => {
    const profile: ShopSocialProfile = {
      handleId: 'fallback_shop',
    };
    render(<ShopProfileSocialInfo shopProfile={profile} />);

    expect(screen.getByText('@fallback_shop')).toBeInTheDocument();
  });

  it('renders address when address is present and showAddress is not false', () => {
    const profile: ShopSocialProfile = {
      address: 'تهران، خیابان آزادی، پلاک ۱۰',
      showAddress: true,
    };
    render(<ShopProfileSocialInfo shopProfile={profile} />);

    expect(screen.getByText('تهران، خیابان آزادی، پلاک ۱۰')).toBeInTheDocument();
  });

  it('hides address when showAddress is false', () => {
    const profile: ShopSocialProfile = {
      followerCount: 500,
      instagram: 'some_shop',
      address: 'تهران، خیابان آزادی',
      showAddress: false,
    };
    render(<ShopProfileSocialInfo shopProfile={profile} />);

    expect(screen.queryByText('تهران، خیابان آزادی')).not.toBeInTheDocument();
    expect(screen.getByText(/تعداد دنبال‌کننده:/)).toBeInTheDocument();
    expect(screen.getByText('@some_shop')).toBeInTheDocument();
  });

  it('renders follower count and Instagram above address in proper order', () => {
    const profile: ShopSocialProfile = {
      followerCount: '1500',
      instagram: 'order_test_shop',
      address: 'تهران، سعادت‌آباد',
      showAddress: true,
    };
    const { container } = render(<ShopProfileSocialInfo shopProfile={profile} />);

    const items = container.querySelectorAll('.space-y-2\\.5 > div');
    expect(items.length).toBe(3);

    // Item 1: follower count
    expect(items[0]).toHaveTextContent('تعداد دنبال‌کننده:');
    // Item 2: instagram
    expect(items[1]).toHaveTextContent('@order_test_shop');
    // Item 3: address
    expect(items[2]).toHaveTextContent('تهران، سعادت‌آباد');
  });

  it('applies custom textColorClass', () => {
    const profile: ShopSocialProfile = {
      followerCount: '100',
      instagram: 'color_test',
    };
    const { container } = render(
      <ShopProfileSocialInfo shopProfile={profile} textColorClass="text-zinc-500" />
    );

    const followerRow = container.querySelector('.text-zinc-500');
    expect(followerRow).toBeInTheDocument();
  });
});
