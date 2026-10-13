import { render, screen } from '@testing-library/react';
import { PrivacyView } from '../PrivacyView';
import { text } from '../../constants';

const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: mockBack,
  }),
}));

describe('PrivacyView', () => {
  it('renders header, intro, all privacy policy sections and contact details', () => {
    render(<PrivacyView />);

    // Header & Page Titles
    expect(screen.getAllByText(text.menu.items.privacy.title).length).toBeGreaterThan(0);
    expect(screen.getByText(text.menu.items.privacy.description)).toBeInTheDocument();

    // Main section heading
    expect(screen.getByRole('heading', { name: 'سیاست حفظ حریم خصوصی اینشاپ', level: 1 })).toBeInTheDocument();

    // Introduction paragraphs
    expect(
      screen.getByText(/وقتی در اینشاپ حساب میسازید، محصولی منتشر میکنید یا با فروشندهای گفتوگو میکنید/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/این سیاست برای خریداران، فروشندگان و بازدیدکنندگان وبسایت/)
    ).toBeInTheDocument();

    // Key Section Headings
    expect(screen.getByRole('heading', { name: 'چه اطلاعاتی در اینشاپ دریافت میشود؟', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'چرا از اطلاعات کاربران استفاده میکنیم؟', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'کدام اطلاعات عمومی هستند؟', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'محرمانگی گفتوگوها و پیامهای پشتیبانی', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'استفاده از دادهها در توسعه و برنامهنویسی', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'سیستم پیشنهاددهنده و خدمات هوش مصنوعی', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'کوکیها و ابزارهای تحلیل بازدید', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'اطلاعات فاکتور، پیشفاکتور و پرداخت', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'چه کسانی ممکن است به اطلاعات دسترسی داشته باشند؟', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ارائه اطلاعات به مراجع قانونی', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'مسئولیت فروشندگان در حفظ اطلاعات خریداران', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'امنیت و نگهداری اطلاعات', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'دسترسی، اصلاح و درخواست حذف اطلاعات', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'پیامهای اطلاعرسانی و تبلیغاتی', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'لینکها و خدمات خارج از اینشاپ', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'تغییرات سیاست حریم خصوصی', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ارتباط درباره حریم خصوصی', level: 2 })).toBeInTheDocument();

    // Data collection items
    expect(screen.getByText('اطلاعات حساب:')).toBeInTheDocument();
    expect(screen.getByText('اطلاعات فروشگاه:')).toBeInTheDocument();
    expect(screen.getByText('محتوای ثبتشده:')).toBeInTheDocument();
    expect(screen.getByText('گفتوگوها:')).toBeInTheDocument();
    expect(screen.getByText('اطلاعات سفارش و اسناد:')).toBeInTheDocument();
    expect(screen.getByText('اطلاعات فنی و استفاده:')).toBeInTheDocument();

    // Specific contents
    expect(screen.getByText(/ایجاد حساب، ورود و مدیریت دسترسیها؛/)).toBeInTheDocument();
    expect(screen.getByText(/عنوان «گفتوگوی مستقیم» یا P2P بهتنهایی به معنی رمزگذاری سرتاسری نیست/)).toBeInTheDocument();
    expect(screen.getByText(/پردازش یک درخواست برای تولید پاسخ با استفاده از آن برای آموزش مدل تفاوت دارد/)).toBeInTheDocument();

    // Privacy Contact Section
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

    expect(
      screen.getByText(/برای بررسی درخواست، تنها اطلاعات ضروری را ارسال کنید/)
    ).toBeInTheDocument();
  });
});
