import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileMenu } from '../ProfileMenu';
import { text } from '../../../constants';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('ProfileMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trigger button and opens menu with exact inShop items', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileMenu username="my_shop" isOwner={true} />);

    const triggerBtn = screen.getByRole('button', { name: text.menu.title });
    expect(triggerBtn).toBeInTheDocument();

    await user.click(triggerBtn);

    // Header title
    expect(screen.getByText(text.menu.title)).toBeInTheDocument();

    // 1. درباره ما
    expect(screen.getByText(text.menu.items.about.title)).toBeInTheDocument();
    expect(screen.getByText(text.menu.items.about.description)).toBeInTheDocument();
    const aboutLink = screen.getByText(text.menu.items.about.title).closest('a');
    expect(aboutLink).toHaveAttribute('href', '/about');

    // 2. تماس با ما
    expect(screen.getByText(text.menu.items.contact.title)).toBeInTheDocument();
    expect(screen.getByText(text.menu.items.contact.description)).toBeInTheDocument();
    const contactLink = screen.getByText(text.menu.items.contact.title).closest('a');
    expect(contactLink).toHaveAttribute('href', '/contact');

    // 3. حریم خصوصی
    expect(screen.getByText(text.menu.items.privacy.title)).toBeInTheDocument();
    expect(screen.getByText(text.menu.items.privacy.description)).toBeInTheDocument();
    const privacyLink = screen.getByText(text.menu.items.privacy.title).closest('a');
    expect(privacyLink).toHaveAttribute('href', '/privacy');

    // 4. قوانین و مقررات
    expect(screen.getByText(text.menu.items.terms.title)).toBeInTheDocument();
    expect(screen.getByText(text.menu.items.terms.description)).toBeInTheDocument();
    const termsLink = screen.getByText(text.menu.items.terms.title).closest('a');
    expect(termsLink).toHaveAttribute('href', '/terms');

    // 5. خروج از حساب کاربری
    expect(screen.getByText(text.menu.items.logout.title)).toBeInTheDocument();
    expect(screen.getByText(text.menu.items.logout.description)).toBeInTheDocument();

    // Verify excluded items are NOT present
    expect(screen.queryByText('اشتراک‌گذاری')).not.toBeInTheDocument();
    expect(screen.queryByText('ویرایش اطلاعات فروشگاه')).not.toBeInTheDocument();
    expect(screen.queryByText('ثبت پست جدید')).not.toBeInTheDocument();
    expect(screen.queryByText('گزارش')).not.toBeInTheDocument();
  });

  it('closes menu when X button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileMenu username="my_shop" isOwner={true} />);

    await user.click(screen.getByRole('button', { name: text.menu.title }));
    expect(screen.getByText(text.menu.title)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: text.menu.closeAction });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(text.menu.items.about.description)).not.toBeInTheDocument();
    });
  });

  it('opens logout confirmation modal when logout is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfileMenu username="my_shop" isOwner={true} />);

    await user.click(screen.getByRole('button', { name: text.menu.title }));
    await user.click(screen.getByText(text.menu.items.logout.title));

    await waitFor(() => {
      expect(screen.getByText('خروج از حساب کاربری')).toBeInTheDocument();
      expect(screen.getByText(/آیا برای خروج از حساب کاربری خود اطمینان دارید؟/)).toBeInTheDocument();
    });
  });
});
