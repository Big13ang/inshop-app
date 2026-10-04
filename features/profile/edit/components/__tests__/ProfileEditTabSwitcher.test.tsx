import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileEditTabSwitcher } from '../ProfileEditTabSwitcher';

describe('ProfileEditTabSwitcher', () => {
  it('renders account tab first and marks it as active by default when activeTab="account"', () => {
    const handleTabChange = jest.fn();
    render(<ProfileEditTabSwitcher activeTab="account" onTabChange={handleTabChange} />);

    const accountTab = screen.getByRole('tab', { name: /حساب کاربری/i });
    const shopTab = screen.getByRole('tab', { name: /پروفایل فروشگاه/i });

    expect(accountTab).toBeInTheDocument();
    expect(shopTab).toBeInTheDocument();

    expect(accountTab).toHaveAttribute('aria-selected', 'true');
    expect(shopTab).toHaveAttribute('aria-selected', 'false');
  });

  it('marks shop tab as active when activeTab="shop"', () => {
    const handleTabChange = jest.fn();
    render(<ProfileEditTabSwitcher activeTab="shop" onTabChange={handleTabChange} />);

    const accountTab = screen.getByRole('tab', { name: /حساب کاربری/i });
    const shopTab = screen.getByRole('tab', { name: /پروفایل فروشگاه/i });

    expect(accountTab).toHaveAttribute('aria-selected', 'false');
    expect(shopTab).toHaveAttribute('aria-selected', 'true');
  });

  it('triggers onTabChange when user clicks shop tab', async () => {
    const user = userEvent.setup();
    const handleTabChange = jest.fn();
    render(<ProfileEditTabSwitcher activeTab="account" onTabChange={handleTabChange} />);

    const shopTab = screen.getByRole('tab', { name: /پروفایل فروشگاه/i });
    await user.click(shopTab);

    expect(handleTabChange).toHaveBeenCalledWith('shop');
  });

  it('triggers onTabChange when user clicks account tab', async () => {
    const user = userEvent.setup();
    const handleTabChange = jest.fn();
    render(<ProfileEditTabSwitcher activeTab="shop" onTabChange={handleTabChange} />);

    const accountTab = screen.getByRole('tab', { name: /حساب کاربری/i });
    await user.click(accountTab);

    expect(handleTabChange).toHaveBeenCalledWith('account');
  });
});
