import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersianDatePicker } from '../PersianDatePicker';

describe('PersianDatePicker', () => {
  const defaultProps = {
    value: '1374/06/15',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trigger buttons with formatted Persian values', () => {
    render(<PersianDatePicker {...defaultProps} label="تاریخ تولد" />);

    expect(screen.getByText('تاریخ تولد')).toBeInTheDocument();
    expect(screen.getByText(/۱۵ شهریور ۱۳۷۴/)).toBeInTheDocument();

    // 3 trigger columns
    expect(screen.getByText('۱۵')).toBeInTheDocument();
    expect(screen.getByText('شهریور')).toBeInTheDocument();
    expect(screen.getByText('۱۳۷۴')).toBeInTheDocument();
  });

  it('opens drawer on day tab when day trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<PersianDatePicker {...defaultProps} />);

    const dayTrigger = screen.getByText('۱۵').closest('button');
    expect(dayTrigger).toBeInTheDocument();
    await user.click(dayTrigger!);

    expect(screen.getByRole('button', { name: 'تایید تاریخ' })).toBeInTheDocument();
  });

  it('opens drawer on month tab and updates date on month pick', async () => {
    const user = userEvent.setup();
    render(<PersianDatePicker {...defaultProps} />);

    const monthTrigger = screen.getByText('شهریور').closest('button');
    await user.click(monthTrigger!);

    const mordadBtn = screen.getByRole('button', { name: /مرداد/ });
    await user.click(mordadBtn);

    expect(defaultProps.onChange).toHaveBeenCalledWith('1374-05-15');
  });

  it('clamps day automatically when switching to a shorter month', async () => {
    const user = userEvent.setup();
    // 31st of Shahrivar
    render(<PersianDatePicker value="1374/06/31" onChange={defaultProps.onChange} />);

    const monthTrigger = screen.getByText('شهریور').closest('button');
    await user.click(monthTrigger!);

    // Mehr has 30 days
    const mehrBtn = screen.getByRole('button', { name: /مهر/ });
    await user.click(mehrBtn);

    expect(defaultProps.onChange).toHaveBeenCalledWith('1374-07-30');
  });

  it('filters items in drawer using search input', async () => {
    const user = userEvent.setup();
    render(<PersianDatePicker {...defaultProps} />);

    const monthTrigger = screen.getByText('شهریور').closest('button');
    await user.click(monthTrigger!);

    const searchInput = screen.getByPlaceholderText(/جستجو در ماه‌ها/);
    await user.type(searchInput, 'اسفند');

    expect(screen.getByRole('button', { name: /اسفند/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /فروردین/ })).not.toBeInTheDocument();
  });

  it('renders error message and helper text when provided', () => {
    render(
      <PersianDatePicker
        {...defaultProps}
        error="تاریخ نامعتبر است"
        helperText="لطفاً تاریخ دقیق را وارد کنید"
      />
    );

    expect(screen.getByText('تاریخ نامعتبر است')).toBeInTheDocument();
  });

  it('does not open drawer when disabled', async () => {
    const user = userEvent.setup();
    render(<PersianDatePicker {...defaultProps} disabled={true} />);

    const dayTrigger = screen.getByText('۱۵').closest('button');
    expect(dayTrigger).toBeDisabled();
    await user.click(dayTrigger!);

    expect(screen.queryByRole('button', { name: 'تایید تاریخ' })).not.toBeInTheDocument();
  });

  it('opens on specified openOnTab for all triggers when openOnTab prop is provided', async () => {
    const user = userEvent.setup();
    render(<PersianDatePicker {...defaultProps} openOnTab="day" />);

    // Click month trigger
    const monthTrigger = screen.getByText('شهریور').closest('button');
    await user.click(monthTrigger!);

    // Should open on day tab instead of month tab
    expect(screen.getByRole('tab', { name: /روز/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /ماه/ })).toHaveAttribute('aria-selected', 'false');
  });
});
  