import { render, screen } from '@testing-library/react';
import { ContactView } from '../ContactView';
import { text } from '../../constants';

const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: mockBack,
  }),
}));

describe('ContactView', () => {
  it('renders title, introductory text, and all contact channels', () => {
    render(<ContactView />);

    // Header & Page Title
    expect(screen.getAllByText(text.menu.items.contact.title).length).toBeGreaterThan(0);

    // Logo & Intro text
    expect(screen.getByAltText('لوگوی برند اینشاپ')).toBeInTheDocument();
    expect(
      screen.getByText(/سؤالی درباره اینشاپ دارید؟ برای ساخت یا تکمیل پروفایل فروشگاهتان/)
    ).toBeInTheDocument();

    // Bale Messenger Support
    expect(screen.getByText('پشتیبانی در پیام‌رسان بله')).toBeInTheDocument();
    expect(screen.getByText('@inShop_support')).toBeInTheDocument();
    const baleLink = screen.getByRole('link', { name: /@inShop_support/i });
    expect(baleLink).toHaveAttribute('href', 'https://ble.ir/inShop_support');

    // Phone & Call Button
    expect(screen.getByText('تلفن')).toBeInTheDocument();
    expect(screen.getAllByText('02191099960').length).toBeGreaterThan(0);
    const callButton = screen.getByText('تماس');
    expect(callButton).toBeInTheDocument();
    expect(callButton).toHaveClass('bg-primary');

    // Address
    expect(screen.getByText('آدرس')).toBeInTheDocument();
    expect(
      screen.getByText(/شیراز، معالی‌آباد، مجتمع تجاری فرهنگی الف، طبقه ششم، واحد ۶۰۴/)
    ).toBeInTheDocument();

    // Social Media
    expect(screen.getByText('ما را در شبکه‌های مجازی دنبال کنید')).toBeInTheDocument();
    expect(screen.getByText('یوتیوب، اینستاگرام، تلگرام')).toBeInTheDocument();

    // Action buttons removed
    expect(screen.queryByRole('link', { name: /تماس مستقیم/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /ارسال پیام در پیام‌رسان بله/ })).not.toBeInTheDocument();
  });
});
