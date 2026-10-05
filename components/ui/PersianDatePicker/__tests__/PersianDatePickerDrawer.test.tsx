import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersianDatePickerDrawer } from '../PersianDatePickerDrawer';

describe('PersianDatePickerDrawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    year: 1374,
    month: 6,
    day: 15,
    onDateChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header with title, live formatted date, and close button', () => {
    render(<PersianDatePickerDrawer {...defaultProps} title="انتخاب تاریخ تولد" />);

    expect(screen.getByText('انتخاب تاریخ تولد')).toBeInTheDocument();
    expect(screen.getByText(/۱۵ شهریور ۱۳۷۴/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'بستن' })).toBeInTheDocument();
  });

  it('renders WAI-ARIA tablist with Day, Month, and Year tabs', () => {
    render(<PersianDatePickerDrawer {...defaultProps} initialTab="day" />);

    const tablist = screen.getByRole('tablist', { name: 'بخش‌های انتخاب تاریخ' });
    expect(tablist).toBeInTheDocument();

    const dayTab = screen.getByRole('tab', { name: /روز/ });
    const monthTab = screen.getByRole('tab', { name: /ماه/ });
    const yearTab = screen.getByRole('tab', { name: /سال/ });

    expect(dayTab).toHaveAttribute('aria-selected', 'true');
    expect(monthTab).toHaveAttribute('aria-selected', 'false');
    expect(yearTab).toHaveAttribute('aria-selected', 'false');

    expect(screen.getByRole('tabpanel', { name: /روز/ })).toHaveAttribute('id', 'date-picker-panel-day');
  });

  it('switches tabs and displays corresponding tabpanel', async () => {
    const user = userEvent.setup();
    render(<PersianDatePickerDrawer {...defaultProps} initialTab="day" />);

    const monthTab = screen.getByRole('tab', { name: /ماه/ });
    await user.click(monthTab);

    expect(monthTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /روز/ })).toHaveAttribute('aria-selected', 'false');
    expect(document.getElementById('date-picker-panel-month')).toBeInTheDocument();

    const yearTab = screen.getByRole('tab', { name: /سال/ });
    await user.click(yearTab);

    expect(yearTab).toHaveAttribute('aria-selected', 'true');
    expect(document.getElementById('date-picker-panel-year')).toBeInTheDocument();
  });

  it('allows selecting day, calls onDateChange, and auto-advances to month tab', async () => {
    const user = userEvent.setup();
    render(<PersianDatePickerDrawer {...defaultProps} initialTab="day" />);

    const day20Btn = screen.getByRole('button', { name: /روز ۲۰/ });
    await user.click(day20Btn);

    expect(defaultProps.onDateChange).toHaveBeenCalledWith(1374, 6, 20);
    expect(screen.getByRole('tab', { name: /ماه/ })).toHaveAttribute('aria-selected', 'true');
    expect(document.getElementById('date-picker-panel-month')).toBeInTheDocument();
  });

  it('allows selecting month, calls onDateChange with clamped day, and auto-advances to year tab', async () => {
    const user = userEvent.setup();
    // 31st of Shahrivar
    render(
      <PersianDatePickerDrawer
        {...defaultProps}
        day={31}
        month={6}
        initialTab="month"
      />
    );

    // Mehr has 30 days
    const mehrBtn = screen.getByRole('button', { name: /ماه مهر/ });
    await user.click(mehrBtn);

    expect(defaultProps.onDateChange).toHaveBeenCalledWith(1374, 7, 30);
    expect(screen.getByRole('tab', { name: /سال/ })).toHaveAttribute('aria-selected', 'true');
    expect(document.getElementById('date-picker-panel-year')).toBeInTheDocument();
  });

  it('allows selecting year, calls onDateChange, and closes the modal', async () => {
    const user = userEvent.setup();
    render(<PersianDatePickerDrawer {...defaultProps} initialTab="year" />);

    const year1380Btn = screen.getByRole('button', { name: /سال ۱۳۸۰/ });
    await user.click(year1380Btn);

    expect(defaultProps.onDateChange).toHaveBeenCalledWith(1380, 6, 15);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('filters items in the active tab with search input and supports clear button', async () => {
    const user = userEvent.setup();
    render(<PersianDatePickerDrawer {...defaultProps} initialTab="month" />);

    const searchInput = screen.getByRole('searchbox', { name: 'جستجوی روز، ماه یا سال' });
    await user.type(searchInput, 'اسفند');

    expect(screen.getByRole('button', { name: /ماه اسفند/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ماه فروردین/ })).not.toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: 'پاک کردن جستجو' });
    await user.click(clearBtn);

    expect(searchInput).toHaveValue('');
    expect(screen.getByRole('button', { name: /ماه فروردین/ })).toBeInTheDocument();
  });

  it('shows accessible empty state with aria-live when search has no matches', async () => {
    const user = userEvent.setup();
    render(<PersianDatePickerDrawer {...defaultProps} initialTab="month" />);

    const searchInput = screen.getByRole('searchbox', { name: 'جستجوی روز، ماه یا سال' });
    await user.type(searchInput, 'کلمه_ناموجود');

    const emptyState = screen.getByRole('status');
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveTextContent('موردی یافت نشد');
    expect(emptyState).toHaveAttribute('aria-live', 'polite');
  });

  it('calls onClose when close button or confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<PersianDatePickerDrawer {...defaultProps} />);

    const closeBtn = screen.getByRole('button', { name: 'بستن' });
    await user.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    const confirmBtn = screen.getByRole('button', { name: 'تایید تاریخ' });
    await user.click(confirmBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});
