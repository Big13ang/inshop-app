import { render, screen } from '@testing-library/react';
import { TermsView } from '../TermsView';
import { text } from '../../constants';

const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: mockBack,
  }),
}));

describe('TermsView', () => {
  it('renders header, title, last updated badge, all 15 sections, and contact channels', () => {
    render(<TermsView />);

    // Header & Page Titles
    expect(screen.getAllByText(text.menu.items.terms.title).length).toBeGreaterThan(0);
    expect(screen.getByText(text.menu.items.terms.description)).toBeInTheDocument();

    // Main section heading & last updated
    expect(screen.getByRole('heading', { name: 'قوانین و مقررات استفاده از اینشاپ', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('آخرین بهروزرسانی: 19 مهر 1405')).toBeInTheDocument();

    // Intro content
    expect(
      screen.getByText(/به اینشاپ خوش آمدید\. این صفحه شرایط استفاده از وبسایت، اپلیکیشن و سایر خدمات/)
    ).toBeInTheDocument();

    // 15 Section Headings
    expect(screen.getByRole('heading', { name: '۱. اینشاپ چیست و چه نقشی دارد؟', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۲. عضویت و حساب کاربری', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۳. مسئولیتهای فروشنده', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۴. مسئولیتهای خریدار', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۵. ثبت سفارش، توافق و حقوق مصرفکننده', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۶. فاکتور، پیشفاکتور و سوابق معامله', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۷. پرداخت و پرداخت امن', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۸. گفتوگوی کاربران و پشتیبانی', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۹. محتوای منتشرشده و حقوق دیگران', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۱۰. پیشنهاد محصولات و ابزارهای هوشمند', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۱۱. نمایش محتوای اینشاپ در سایتها و ابزارهای دیگر', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۱۲. حریم خصوصی، محرمانگی و استفاده از دادهها', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۱۳. گزارش تخلف، محدودیت حساب و اختلافات', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۱۴. دسترسی به خدمات و تغییر مقررات', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '۱۵. راه ارتباط با اینشاپ', level: 2 })).toBeInTheDocument();

    // Specific contents verification
    expect(
      screen.getByText(/در معاملاتی که خریدار و فروشنده مستقیماً با یکدیگر انجام میدهند، اینشاپ مالک کالا/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/فروشنده نمیتواند صرفاً با نوشتن «مرجوعی نداریم» یا عبارتی مشابه، حقوق قانونی خریدار را حذف کند/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/عنوان «پرداخت امن» بهتنهایی به معنی تضمین بیقیدوشرط کیفیت کالا/)
    ).toBeInTheDocument();

    // Contact channels in section 15
    expect(screen.getByText('پیام‌رسان بله')).toBeInTheDocument();
    expect(screen.getByText('@inShop_support')).toBeInTheDocument();
    const baleLink = screen.getByRole('link', { name: /@inShop_support/i });
    expect(baleLink).toHaveAttribute('href', 'https://ble.ir/inShop_support');

    expect(screen.getByText('تلفن')).toBeInTheDocument();
    expect(screen.getAllByText('02191099960').length).toBeGreaterThan(0);
    const phoneLink = screen.getByRole('link', { name: /02191099960/i });
    expect(phoneLink).toHaveAttribute('href', 'tel:02191099960');

    expect(screen.getByText('نشانی')).toBeInTheDocument();
    expect(
      screen.getByText(/شیراز، معالیآباد، مجتمع تجاری فرهنگی الف، طبقه ششم، واحد ۶۰۴/)
    ).toBeInTheDocument();
  });
});
