import { render, screen } from '@testing-library/react';
import { AboutView } from '../AboutView';
import { text } from '../../constants';

const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: mockBack,
  }),
}));

describe('AboutView', () => {
  it('renders header, title, and "درباره اینشاپ" section with all paragraphs', () => {
    render(<AboutView />);

    // Header & Page Titles
    expect(screen.getAllByText(text.menu.items.about.title).length).toBeGreaterThan(0);
    expect(screen.getByText(text.menu.items.about.description)).toBeInTheDocument();

    // Section Header (h1 is 'درباره اینشاپ', 'درباره ما' is removed from beneath logo)
    expect(screen.getByRole('heading', { name: 'درباره اینشاپ', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: text.menu.items.about.title })).not.toBeInTheDocument();

    // The 4 paragraphs from user specification
    expect(
      screen.getByText(/خرید و سفارش یک کالا گاهی با دیدن یک عکس یا ویدئو اینستاگرامی طنزآمیز/)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/در اینشاپ، عرضه کنندگان کالا و خدمات میتوانند برای خودشان پروفایل/)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/مجموعه اینشاپ توسعه این پلتفرم را بر اساس تجربه خریداران و فروشندگان/)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/اینشاپ پلتفرم نسل سوم فروش اینترنتی است که در مسیر رشد خود/)
    ).toBeInTheDocument();

    // Platform features
    expect(screen.getByText('ویژگی‌های پلتفرم')).toBeInTheDocument();
    expect(screen.getByText('فروشگاه‌های منتخب')).toBeInTheDocument();
    expect(screen.getByText('فروشندگان احراز هویت شده')).toBeInTheDocument();
    expect(screen.getByText('ارتباط مستقیم خریدار و فروشنده')).toBeInTheDocument();
  });
});
